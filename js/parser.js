/* ==========================================================================
   SAVDOGAR DAFTARI — High-Accuracy Multilingual Speech & Text Parser
   Full support for Uzbek Latin, Uzbek Cyrillic, and Russian numbers & keywords
   ========================================================================== */

class UzbekVoiceParser {
  constructor() {
    // Keywords signifying DEBT (Nasiya / Qarz / Chiqim)
    this.debtKeywords = [
      // Uzbek Latin
      'nasiya', 'qarz', 'oldi', 'yozib', 'yozing', 'berildi', 'berdik', 'qarzga', 'nasiyaga', 'chiqim',
      // Uzbek Cyrillic
      'насия', 'қарз', 'карз', 'олди', 'ёзиб', 'ёзинг', 'езинг', 'берилди', 'беринг', 'чиқим',
      // Russian
      'в долг', 'долг', 'взял', 'записать', 'запиши', 'записал', 'кредит'
    ];

    // Keywords signifying PAYMENT (To'lov / Kirim / Qaytarish)
    this.paymentKeywords = [
      // Uzbek Latin
      "to'ladi", "toladi", "berdi", "qaytardi", "qaytdi", "yopdi", "tushdi",
      "tashladi", "kirdi", "to'lov", "tolov", "qarzini uzdi", "uzdi", "qaytib keldi",
      // Uzbek Cyrillic
      'тўлади', 'тулади', 'берди', 'қайтарди', 'кайтарди', 'қайтди', 'кайтди', 'ёпди', 'епди', 'тушди', 'тўлов', 'тулов', 'узди',
      // Russian
      'оплатил', 'заплатил', 'отдал', 'вернул', 'закрыл', 'перевел', 'перечислил', 'оплата', 'платеж', 'погасил'
    ];

    // Number word multipliers: Uzbek Latin, Cyrillic, and Russian
    this.wordNumbers = {
      // Units 1-9
      'bir': 1, 'бир': 1, 'один': 1, 'одна': 1,
      'ikki': 2, 'икки': 2, 'два': 2, 'две': 2,
      'uch': 3, 'уч': 3, 'три': 3,
      'tort': 4, "to'rt": 4, 'тўрт': 4, 'турт': 4, 'четыре': 4,
      'besh': 5, 'беш': 5, 'пять': 5,
      'olti': 6, 'олти': 6, 'шесть': 6,
      'yetti': 7, 'етти': 7, 'семь': 7,
      'sakkiz': 8, 'саккиз': 8, 'восемь': 8,
      'toqqiz': 9, "to'qqiz": 9, 'тўққиз': 9, 'туккиз': 9, 'девять': 9,

      // Tens 10-90
      'on': 10, "o'n": 10, 'ўн': 10, 'ун': 10, 'десять': 10,
      'yigirma': 20, 'йигирма': 20, 'двадцать': 20,
      'ottiz': 30, "o'ttiz": 30, 'ўттиз': 30, 'уттиз': 30, 'тридцать': 30,
      'qirq': 40, 'қирқ': 40, 'кирк': 40, 'сорок': 40,
      'ellik': 50, 'эллик': 50, 'пятьдесят': 50,
      'oltmish': 60, 'олтмиш': 60, 'шестьдесят': 60,
      'yetmish': 70, 'етмиш': 70, 'семьдесят': 70,
      'sakson': 80, 'саксон': 80, 'восемьдесят': 80,
      'toqson': 90, "to'qson": 90, 'тўқсон': 90, 'туксон': 90, 'девяносто': 90,

      // Hundreds 100-900
      'yuz': 100, 'юз': 100, 'сто': 100,
      'двести': 200, 'триста': 300, 'четыреста': 400,
      'пятьсот': 500, 'шестьсот': 600, 'семьсот': 700,
      'восемьсот': 800, 'девятьсот': 900,

      // Thousands & Millions
      'ming': 1000, 'минг': 1000, 'тысяч': 1000, 'тысяча': 1000, 'тысячи': 1000,
      'million': 1000000, 'миллион': 1000000, 'миллиона': 1000000, 'млн': 1000000,

      // Halves
      'yarim': 500000, 'ярим': 500000, 'полмиллиона': 500000
    };
  }

  /**
   * Parse speech transcript or text with high accuracy
   * @param {string} text 
   * @returns {Object} { customerName, amount, type, description, rawText }
   */
  parse(text) {
    if (!text || typeof text !== 'string') {
      return null;
    }

    const clean = text.trim();
    const lower = clean.toLowerCase();

    // 0. Check if a 5-digit customer ID is mentioned (e.g. "10001 150 ming oldi")
    let id5Match = clean.match(/\b(1\d{4}|\d{5})\b/);
    let matchedCustomerById = null;
    let textToParseAmount = lower;

    if (id5Match) {
      if (window.Store && window.Store.getCustomerById5) {
        matchedCustomerById = window.Store.getCustomerById5(id5Match[1]);
      }
      // Remove 5-digit ID from text so it does not collide with currency amount
      textToParseAmount = lower.replace(id5Match[0], ' ').replace(/\s+/g, ' ').trim();
    }

    // 1. Determine Transaction Type (DEBT vs PAYMENT)
    let type = 'DEBT'; // Default is nasiya
    let isPayment = false;

    for (const kw of this.paymentKeywords) {
      if (lower.includes(kw)) {
        isPayment = true;
        break;
      }
    }

    if (isPayment) {
      type = 'PAYMENT';
    } else {
      type = 'DEBT';
    }

    // 2. Extract Amount
    const amount = this.extractAmount(textToParseAmount);

    // 3. Extract Customer Name
    let customerName = matchedCustomerById ? matchedCustomerById.name : this.extractName(clean, lower);
    if (!matchedCustomerById && id5Match) {
      customerName = `Mijoz #${id5Match[1]}`;
    }

    // 4. Extract Description
    const description = this.extractDescription(clean, customerName, amount, type);

    return {
      customerName: customerName || "Noma'lum mijoz",
      customerMatched: matchedCustomerById,
      customerId5: id5Match ? id5Match[1] : (matchedCustomerById ? matchedCustomerById.id5 : null),
      amount: amount || 0,
      type: type, // 'DEBT' or 'PAYMENT'
      description: description || (type === 'DEBT' ? "Nasiya savdo" : "Qarz to'lovi"),
      rawText: clean
    };
  }

  /**
   * Extract financial amount from text (digits, written words in Uzbek/Russian)
   */
  extractAmount(text) {
    // Normalize special compound phrases like 'bir yarim million' or 'yarim million'
    let normalizedText = text
      .replace(/bir\s+yarim\s+million|бир\s+ярим\s+миллион|полтора\s+миллиона|полтора\s+млн/gi, '1500000 ')
      .replace(/yarim\s+million|ярим\s+миллион|полмиллиона/gi, '500000 ');

    // Case 1: Decimal million/ming e.g. "1.5 million" or "2,5 mln" or "1.5 минг"
    const decimalMatch = normalizedText.match(/(\d+[.,]\d+)\s*(million|миллион|млн|ming|минг|тысяч|тыс)/i);
    if (decimalMatch) {
      const val = parseFloat(decimalMatch[1].replace(',', '.'));
      const unit = decimalMatch[2].toLowerCase();
      if (unit.includes('mln') || unit.includes('million') || unit.includes('миллион')) return Math.round(val * 1000000);
      if (unit.includes('ming') || unit.includes('минг') || unit.includes('тыс')) return Math.round(val * 1000);
    }

    // Case 2: Number followed by 'ming' or 'mln' (e.g. "150 ming", "80 000 so'm", "200минг", "50 тысяч")
    const numUnitMatch = normalizedText.match(/(\d+[\d\s]*)\s*(ming|минг|тысяч|тысячи|тыс|million|миллион|млн)/i);
    if (numUnitMatch) {
      const rawNum = parseInt(numUnitMatch[1].replace(/\s+/g, ''), 10);
      const unit = numUnitMatch[2].toLowerCase();
      if (unit.includes('ming') || unit.includes('минг') || unit.includes('тыс')) return rawNum * 1000;
      if (unit.includes('million') || unit.includes('миллион') || unit.includes('млн')) return rawNum * 1000000;
    }

    // Case 3: Pure digit sequence e.g. "150 000", "20000", "50000 so'm"
    const digitMatch = normalizedText.match(/(\d{1,3}(?:[\s]\d{3})+|\d{4,9})/);
    if (digitMatch) {
      return parseInt(digitMatch[1].replace(/\s+/g, ''), 10);
    }

    // Case 4: Textual words e.g. "yuz ellik ming", "сто тысяч", "эллик минг", "йигирма минг"
    const textAmount = this.parseTextNumbers(normalizedText);
    if (textAmount > 0) {
      return textAmount;
    }

    return 0;
  }

  parseTextNumbers(text) {
    const tokens = text.toLowerCase().split(/\s+/);
    let total = 0;
    let current = 0;

    for (const token of tokens) {
      const cleanToken = token.replace(/[^a-zа-яёўқғҳ']/gi, '');
      if (this.wordNumbers[cleanToken] !== undefined) {
        const val = this.wordNumbers[cleanToken];

        if (val === 1000) {
          current = (current === 0 ? 1 : current) * 1000;
          total += current;
          current = 0;
        } else if (val === 1000000) {
          current = (current === 0 ? 1 : current) * 1000000;
          total += current;
          current = 0;
        } else if (val === 100) {
          current = (current === 0 ? 1 : current) * 100;
        } else if (val >= 200 && val <= 900) {
          current += val;
        } else {
          current += val;
        }
      }
    }
    total += current;
    return total;
  }

  stripSuffix(word) {
    if (!word || word.length < 5) return word;
    if (word.endsWith('dan') || word.endsWith('дан')) return word.slice(0, -3);
    if (word.endsWith('ning') || word.endsWith('нинг')) return word.slice(0, -4);
    if (word.endsWith('day')) return word.slice(0, -3);
    return word;
  }

  isNumberWord(word) {
    if (!word) return false;
    const clean = word.toLowerCase().replace(/[^a-zа-яёўқғҳ']/gi, '');
    return !isNaN(parseInt(clean, 10)) || this.wordNumbers[clean] !== undefined;
  }

  extractName(originalText, lowerText) {
    const rawWords = originalText.split(/\s+/).filter(w => w.trim().length > 0);
    if (rawWords.length === 0) return "Mijoz";

    const honorifics = [
      'aka', 'ака', 'opa', 'опа', 'toga', "tog'a", 'тога', 'amaki', 'амаки',
      'xola', 'хола', 'usta', 'уста', 'boy', 'бой', 'shofyor', 'шофер', 'haydovchi'
    ];

    // Filter out words that are numbers or known debt/payment keywords
    const candidateWords = [];
    for (const w of rawWords) {
      const cleanW = w.toLowerCase().replace(/[^a-zа-яёўқғҳ']/gi, '');
      if (this.isNumberWord(cleanW) || this.debtKeywords.includes(cleanW) || this.paymentKeywords.includes(cleanW)) {
        break; // Stop at first number or command word
      }
      candidateWords.push(w);
    }

    if (candidateWords.length === 0) return "Mijoz";

    if (candidateWords.length >= 2) {
      const baseSecond = this.stripSuffix(candidateWords[1].toLowerCase().replace(/[^a-zа-яёўқғҳ']/gi, ''));
      if (honorifics.includes(baseSecond)) {
        return `${this.stripSuffix(candidateWords[0])} ${baseSecond}`;
      }
      return `${this.stripSuffix(candidateWords[0])} ${this.stripSuffix(candidateWords[1])}`;
    }

    return this.stripSuffix(candidateWords[0]);
  }

  extractDescription(originalText, name, amount, type) {
    let clean = originalText;

    if (name) {
      clean = clean.replace(new RegExp(name, 'i'), '');
    }

    const junkWords = [
      'bugun', 'бугун', 'kecha', 'кеча', 'som', "so'm", 'сом', 'сум', 'ming', 'минг', 'тысяч', 'тыс', 'million', 'миллион',
      'nasiya', 'насия', 'qarz', 'карз', 'долг', 'oldi', 'олди', 'взял', 'berdi', 'берди', 'toladi', "to'ladi", 'тулади',
      'qaytardi', 'кайтарди', 'yozib', 'ёзиб', 'iltimos', 'илтимос', 'dan', 'дан', 'ga', 'га'
    ];

    const tokens = clean.split(/\s+/).filter(t => {
      const w = t.toLowerCase().replace(/[^a-zа-яёўқғҳ']/gi, '');
      return w.length > 2 && !junkWords.includes(w) && isNaN(parseInt(w, 10));
    });

    if (tokens.length > 0) {
      return tokens.join(' ');
    }

    return type === 'DEBT' ? "Nasiya savdo" : "Qarz to'lovi";
  }
}

// Global instance
window.UzbekParser = new UzbekVoiceParser();
