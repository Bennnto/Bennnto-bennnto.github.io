// ── TYPR LEXER, PARSER, TYPE CHECKER & INTERPRETER IN JAVASCRIPT ──

class TyprType {
  constructor(name, isOptional = false) {
    this.name = name; // 'int', 'str', 'float', 'bool', 'nil', 'void', 'unknown'
    this.isOptional = isOptional;
  }

  toString() {
    return this.name + (this.isOptional ? '?' : '');
  }

  isNumeric() {
    return this.name === 'int' || this.name === 'float';
  }

  isCompatibleWith(other) {
    if (this.name === 'unknown' || other.name === 'unknown') return true;
    if (this.name === other.name) return true;
    if (this.name === 'float' && other.name === 'int') return true;
    if (this.isOptional && other.name === 'nil') return true;
    return false;
  }

  commonType(other) {
    if (this.name === 'float' || other.name === 'float') return new TyprType('float');
    return this;
  }
}

const TYPE_INT = new TyprType('int');
const TYPE_FLOAT = new TyprType('float');
const TYPE_STR = new TyprType('str');
const TYPE_BOOL = new TyprType('bool');
const TYPE_NIL = new TyprType('nil');
const TYPE_VOID = new TyprType('void');
const TYPE_UNKNOWN = new TyprType('unknown');

function typeFromString(str) {
  const isOptional = str.endsWith('?');
  const base = isOptional ? str.slice(0, -1) : str;
  return new TyprType(base, isOptional);
}

// 1. TOKENIZER (LEXER)
function tokenizeTypr(code) {
  const tokens = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];

    // Whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Comments: // or #
    if ((char === '/' && code[i + 1] === '/') || char === '#') {
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Numbers (Float & Int)
    if (/\d/.test(char)) {
      let num = '';
      while (i < code.length && /[\d\.]/.test(code[i])) {
        num += code[i];
        i++;
      }
      if (num.includes('.')) {
        tokens.push({ type: 'FLOAT_VAL', value: parseFloat(num) });
      } else {
        tokens.push({ type: 'INT_VAL', value: parseInt(num, 10) });
      }
      continue;
    }

    // Strings
    if (char === '"' || char === "'") {
      const quote = char;
      let str = '';
      i++; // skip quote
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\n') {
          throw new SyntaxError("Lexical Error: Unterminated string literal");
        }
        str += code[i];
        i++;
      }
      i++; // skip closing quote
      tokens.push({ type: 'STRING_VAL', value: str });
      continue;
    }

    // Identifiers, Keywords, Types
    if (/[a-zA-Z_]/.test(char)) {
      let id = '';
      while (i < code.length && /[a-zA-Z0-9_\?]/.test(code[i])) {
        id += code[i];
        i++;
      }

      const keywords = ['init', 'let', 'if', 'else', 'while', 'return', 'true', 'false', 'nil', 'const'];
      const types = ['int', 'str', 'float', 'bool', 'void', 'int?', 'str?', 'float?', 'bool?'];

      if (keywords.includes(id)) {
        tokens.push({ type: id.toUpperCase(), value: id });
      } else if (types.includes(id)) {
        tokens.push({ type: 'TYPE', value: id });
      } else if (id === 'true' || id === 'false') {
        tokens.push({ type: 'BOOL_VAL', value: id === 'true' });
      } else if (id === 'nil') {
        tokens.push({ type: 'NIL_VAL', value: null });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: id });
      }
      continue;
    }

    // Operators (2 characters)
    const next2 = code.substr(i, 2);
    const ops2 = {
      '==': 'EQ',
      '!=': 'NE',
      '<=': 'LE',
      '>=': 'GE',
      '&&': 'AND',
      '||': 'OR',
      '++': 'INC',
      '--': 'DEC'
    };
    if (ops2[next2]) {
      tokens.push({ type: ops2[next2], value: next2 });
      i += 2;
      continue;
    }

    // Operators/Delimiters (1 character)
    const ops1 = {
      '=': 'ASSIGN',
      '+': 'ADD',
      '-': 'SUB',
      '*': 'MUL',
      '/': 'DIV',
      '%': 'MOD',
      '<': 'LT',
      '>': 'GT',
      '!': 'NOT',
      '(': 'LPAREN',
      ')': 'RPAREN',
      '{': 'LBRACE',
      '}': 'RBRACE',
      '[': 'LBRACKET',
      ']': 'RBRACKET',
      ',': 'COMMA',
      ':': 'COLON',
      ';': 'SEMICOLON',
      '?': 'QUESTION',
      '.': 'DOT'
    };

    if (ops1[char]) {
      tokens.push({ type: ops1[char], value: char });
      i++;
      continue;
    }

    throw new SyntaxError(`Lexical Error: Unexpected character '${char}'`);
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// 2. PARSER
class TyprParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  consume(type) {
    const tok = this.peek();
    if (type && tok.type !== type) {
      throw new SyntaxError(`Parser Error: Expected ${type}, got ${tok.type} ('${tok.value}')`);
    }
    this.pos++;
    return tok;
  }

  match(type) {
    if (this.peek().type === type) {
      this.consume();
      return true;
    }
    return false;
  }

  parseProgram() {
    const stmts = [];
    while (this.peek().type !== 'EOF') {
      stmts.push(this.parseStatement());
    }
    return stmts;
  }

  parseStatement() {
    const tok = this.peek();

    if (tok.type === 'INIT') {
      this.consume();
      const typeTok = this.consume('TYPE');
      this.consume('COLON');
      const id = this.consume('IDENTIFIER').value;
      this.consume('ASSIGN');
      const expr = this.parseExpression();
      this.match('SEMICOLON');
      return { type: 'InitNode', varType: typeTok.value, ident: id, value: expr };
    }

    if (tok.type === 'LET') {
      this.consume();
      const id = this.consume('IDENTIFIER').value;
      this.consume('ASSIGN');
      const expr = this.parseExpression();
      this.match('SEMICOLON');
      return { type: 'LetNode', ident: id, expression: expr };
    }

    if (tok.type === 'IF') {
      this.consume();
      const condition = this.parseExpression();
      const ifBlock = this.parseBlock();
      let elseBlock = null;
      if (this.match('ELSE')) {
        if (this.peek().type === 'IF') {
          elseBlock = this.parseStatement();
        } else {
          elseBlock = this.parseBlock();
        }
      }
      return { type: 'FlowNode', condition, if_block: ifBlock, else_block: elseBlock };
    }

    if (tok.type === 'WHILE') {
      this.consume();
      // Allow optional parenthesization
      const hasParen = this.match('LPAREN');
      const condition = this.parseExpression();
      if (hasParen) this.consume('RPAREN');
      const block = this.parseBlock();
      return { type: 'WhileNode', condition, block };
    }

    const expr = this.parseExpression();
    this.match('SEMICOLON');
    return expr;
  }

  parseBlock() {
    this.consume('LBRACE');
    const stmts = [];
    while (this.peek().type !== 'RBRACE' && this.peek().type !== 'EOF') {
      stmts.push(this.parseStatement());
    }
    this.consume('RBRACE');
    return { type: 'BlockNode', statements: stmts };
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const expr = this.parseOr();
    if (this.peek().type === 'ASSIGN') {
      if (expr.type !== 'IDNode') {
        throw new SyntaxError('Parser Error: Left-hand side of assignment must be an identifier');
      }
      this.consume('ASSIGN');
      const val = this.parseAssignment();
      return { type: 'AssignNode', ident: expr.value, expression: val };
    }
    return expr;
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.match('OR')) {
      const right = this.parseAnd();
      left = { type: 'OpsNode', ops: '||', left, right };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseEquality();
    while (this.match('AND')) {
      const right = this.parseEquality();
      left = { type: 'OpsNode', ops: '&&', left, right };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseComparison();
    while (this.peek().type === 'EQ' || this.peek().type === 'NE') {
      const op = this.consume().value;
      const right = this.parseComparison();
      left = { type: 'OpsNode', ops: op, left, right };
    }
    return left;
  }

  parseComparison() {
    let left = this.parseAdditive();
    const ops = ['LT', 'GT', 'LE', 'GE'];
    while (ops.includes(this.peek().type)) {
      const op = this.consume().value;
      const right = this.parseAdditive();
      left = { type: 'OpsNode', ops: op, left, right };
    }
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    while (this.peek().type === 'ADD' || this.peek().type === 'SUB') {
      const op = this.consume().value;
      const right = this.parseMultiplicative();
      left = { type: 'OpsNode', ops: op, left, right };
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();
    while (this.peek().type === 'MUL' || this.peek().type === 'DIV' || this.peek().type === 'MOD') {
      const op = this.consume().value;
      const right = this.parseUnary();
      left = { type: 'OpsNode', ops: op, left, right };
    }
    return left;
  }

  parseUnary() {
    if (this.match('SUB')) {
      return { type: 'UminusNode', expression: this.parseUnary() };
    }
    if (this.match('NOT')) {
      return { type: 'SingleOpsNode', ops: '!', expression: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const tok = this.peek();

    if (tok.type === 'INT_VAL' || tok.type === 'FLOAT_VAL') {
      this.consume();
      return { type: 'NumberNode', value: tok.value, valueType: tok.type === 'INT_VAL' ? 'int' : 'float' };
    }

    if (tok.type === 'STRING_VAL') {
      this.consume();
      return { type: 'StringNode', value: tok.value };
    }

    if (tok.type === 'BOOL_VAL') {
      this.consume();
      return { type: 'BoolNode', value: tok.value };
    }

    if (tok.type === 'NIL_VAL') {
      this.consume();
      return { type: 'NullNode', value: null };
    }

    if (tok.type === 'IDENTIFIER') {
      this.consume();
      if (this.match('LPAREN')) {
        const args = [];
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseExpression());
          while (this.match('COMMA')) {
            args.push(this.parseExpression());
          }
        }
        this.consume('RPAREN');
        return { type: 'CallNode', ident: tok.value, param: args };
      }
      return { type: 'IDNode', value: tok.value };
    }

    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN');
      return expr;
    }

    throw new SyntaxError(`Parser Error: Unexpected token '${tok.value}'`);
  }
}

// 3. STATIC TYPE CHECKER
class TyprTypeEnv {
  constructor(parent = null) {
    this.variables = {};
    this.parent = parent;
  }

  declare(name, type) {
    this.variables[name] = type;
  }

  get(name) {
    if (name in this.variables) return this.variables[name];
    if (this.parent) return this.parent.get(name);
    return null;
  }
}

function typeCheck(node, env) {
  if (Array.isArray(node)) {
    for (const stmt of node) {
      typeCheck(stmt, env);
    }
    return TYPE_VOID;
  }

  switch (node.type) {
    case 'NumberNode':
      return node.valueType === 'int' ? TYPE_INT : TYPE_FLOAT;
    case 'StringNode':
      return TYPE_STR;
    case 'BoolNode':
      return TYPE_BOOL;
    case 'NullNode':
      return TYPE_NIL;

    case 'IDNode': {
      const t = env.get(node.value);
      if (!t) throw new TypeError(`Error:Undefined Variable : < ${node.value} >`);
      return t;
    }

    case 'InitNode': {
      const expectedType = typeFromString(node.varType);
      const valType = typeCheck(node.value, env);

      if (valType.name === 'nil' && !expectedType.isOptional) {
        throw new TypeError(`Error:Cannot Initialized ${expectedType} with Nil`);
      }
      if (!expectedType.isCompatibleWith(valType)) {
        throw new TypeError(`Error:Cannot initialized ${expectedType} with ${valType}`);
      }
      env.declare(node.ident, expectedType);
      return expectedType;
    }

    case 'LetNode': {
      const valType = typeCheck(node.expression, env);
      env.declare(node.ident, valType);
      return valType;
    }

    case 'AssignNode': {
      const varType = env.get(node.ident);
      if (!varType) throw new TypeError(`Undefined variable : ${node.ident}`);
      const valType = typeCheck(node.expression, env);

      if (valType.name === 'nil' && !varType.isOptional) {
        throw new TypeError(`Error:Cannot assign ${valType} to ${varType}`);
      }
      if (!varType.isCompatibleWith(valType)) {
        throw new TypeError(`Error:Cannot assign ${valType} to ${varType}`);
      }
      return varType;
    }

    case 'UminusNode': {
      const t = typeCheck(node.expression, env);
      if (!t.isNumeric()) throw new TypeError("Error:Unary minus requires numeric type");
      return t;
    }

    case 'SingleOpsNode': {
      const t = typeCheck(node.expression, env);
      if (node.ops === '!') {
        if (t.name !== 'bool') throw new TypeError("Error:Cannot perform ! required boolean type");
        return TYPE_BOOL;
      }
      return t;
    }

    case 'OpsNode': {
      const left = typeCheck(node.left, env);
      const right = typeCheck(node.right, env);
      const common = left.commonType(right);

      if (node.ops === '+') {
        if (left.name === 'str' && right.name === 'str') return TYPE_STR;
        if (left.name === 'str' && right.isNumeric()) return TYPE_STR;
        if (left.isNumeric() && right.name === 'str') return TYPE_STR;
        if (left.isNumeric() && right.isNumeric()) return common;
        throw new TypeError(`Error:Cannot perform + on ${left} and ${right}`);
      }

      if (['-', '*', '/', '%'].includes(node.ops)) {
        if (!left.isNumeric() || !right.isNumeric()) {
          throw new TypeError(`Error:Cannot perform ${node.ops} required numeric types`);
        }
        return common;
      }

      if (['<', '>', '>=', '<=', '!=', '=='].includes(node.ops)) {
        if (!left.isCompatibleWith(right) && !right.isCompatibleWith(left)) {
          throw new TypeError(`Error:Cannot perform ${node.ops} variable type not compatible`);
        }
        return TYPE_BOOL;
      }

      if (['&&', '||'].includes(node.ops)) {
        if (left.name !== 'bool' || right.name !== 'bool') {
          throw new TypeError(`Error:Cannot Perform ${node.ops} required boolean type`);
        }
        return TYPE_BOOL;
      }
      break;
    }

    case 'FlowNode': {
      const cond = typeCheck(node.condition, env);
      if (cond.name !== 'bool') throw new TypeError("Error:Condition Type must be boolean type");
      typeCheck(node.if_block, new TyprTypeEnv(env));
      if (node.else_block) typeCheck(node.else_block, new TyprTypeEnv(env));
      return TYPE_VOID;
    }

    case 'BlockNode': {
      const blockEnv = new TyprTypeEnv(env);
      for (const stmt of node.statements) {
        typeCheck(stmt, blockEnv);
      }
      return TYPE_VOID;
    }

    case 'WhileNode': {
      const cond = typeCheck(node.condition, env);
      if (cond.name !== 'bool') throw new TypeError("Error:Condition Type must be boolean type");
      typeCheck(node.block, new TyprTypeEnv(env));
      return TYPE_VOID;
    }

    case 'CallNode': {
      if (node.ident === 'disp') {
        node.param.forEach(p => typeCheck(p, env));
        return TYPE_VOID;
      }
      const builtins = ['sqrt', 'abs', 'round', 'ceil', 'floor'];
      if (builtins.includes(node.ident)) {
        if (node.param.length !== 1) throw new TypeError(`Error:Function ${node.ident} takes 1 argument`);
        const argT = typeCheck(node.param[0], env);
        if (!argT.isNumeric()) throw new TypeError(`Error:Function ${node.ident} requires numeric type`);
        return TYPE_FLOAT;
      }
      throw new TypeError(`Error:Undefined function < ${node.ident} >`);
    }
  }

  return TYPE_UNKNOWN;
}

// 4. RUNTIME EVALUATOR
class TyprValEnv {
  constructor(parent = null) {
    this.variables = {};
    this.parent = parent;
  }

  declare(name, value) {
    this.variables[name] = value;
  }

  get(name) {
    if (name in this.variables) return this.variables[name];
    if (this.parent) return this.parent.get(name);
    throw new Error(`Runtime Error: Undefined identifier '${name}'`);
  }

  set(name, value) {
    if (name in this.variables) {
      this.variables[name] = value;
      return;
    }
    if (this.parent) {
      this.parent.set(name, value);
      return;
    }
    throw new Error(`Runtime Error: Undefined identifier '${name}'`);
  }
}

function evaluateTypr(node, env, outputFn) {
  if (Array.isArray(node)) {
    let last = null;
    for (const stmt of node) {
      last = evaluateTypr(stmt, env, outputFn);
    }
    return last;
  }

  switch (node.type) {
    case 'NumberNode':
    case 'StringNode':
    case 'BoolNode':
    case 'NullNode':
      return node.value;

    case 'IDNode':
      return env.get(node.value);

    case 'InitNode': {
      const val = evaluateTypr(node.value, env, outputFn);
      env.declare(node.ident, val);
      return val;
    }

    case 'LetNode': {
      const val = evaluateTypr(node.expression, env, outputFn);
      env.declare(node.ident, val);
      return val;
    }

    case 'AssignNode': {
      const val = evaluateTypr(node.expression, env, outputFn);
      env.set(node.ident, val);
      return val;
    }

    case 'UminusNode':
      return -evaluateTypr(node.expression, env, outputFn);

    case 'SingleOpsNode':
      if (node.ops === '!') {
        return !evaluateTypr(node.expression, env, outputFn);
      }
      break;

    case 'OpsNode': {
      const left = evaluateTypr(node.left, env, outputFn);
      const right = evaluateTypr(node.right, env, outputFn);

      switch (node.ops) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/':
          if (right === 0) throw new Error("Runtime Error: Division by zero");
          return left / right;
        case '%':
          if (right === 0) throw new Error("Runtime Error: Division by zero");
          return left % right;
        case '==': return left === right;
        case '!=': return left !== right;
        case '<': return left < right;
        case '>': return left > right;
        case '<=': return left <= right;
        case '>=': return left >= right;
        case '&&': return left && right;
        case '||': return left || right;
      }
      break;
    }

    case 'FlowNode': {
      const cond = evaluateTypr(node.condition, env, outputFn);
      if (cond) {
        return evaluateTypr(node.if_block, env, outputFn);
      } else if (node.else_block) {
        return evaluateTypr(node.else_block, env, outputFn);
      }
      return null;
    }

    case 'BlockNode': {
      const blockEnv = new TyprValEnv(env);
      let last = null;
      for (const stmt of node.statements) {
        last = evaluateTypr(stmt, blockEnv, outputFn);
      }
      return last;
    }

    case 'WhileNode': {
      let last = null;
      let iterations = 0;
      while (evaluateTypr(node.condition, env, outputFn)) {
        iterations++;
        if (iterations > 10000) {
          throw new Error("Runtime Error: Infinite loop limit exceeded (10,000 iterations)");
        }
        last = evaluateTypr(node.block, env, outputFn);
      }
      return last;
    }

    case 'CallNode': {
      if (node.ident === 'disp') {
        const args = node.param.map(p => evaluateTypr(p, env, outputFn));
        const formattedArgs = args.map(a => a === null ? 'nil' : String(a));
        outputFn(formattedArgs.join(' '));
        return null;
      }

      const mathFuncs = {
        'sqrt': Math.sqrt,
        'abs': Math.abs,
        'round': Math.round,
        'ceil': Math.ceil,
        'floor': Math.floor
      };

      if (mathFuncs[node.ident]) {
        const arg = evaluateTypr(node.param[0], env, outputFn);
        return mathFuncs[node.ident](arg);
      }

      throw new Error(`Runtime Error: Function '${node.ident}' is not defined`);
    }
  }

  throw new Error(`Runtime Error: Unhandled node type '${node.type}'`);
}

// Global API
window.runTyprCode = function(code, outputFn) {
  try {
    const tokens = tokenizeTypr(code);
    const parser = new TyprParser(tokens);
    const ast = parser.parseProgram();

    const typeEnv = new TyprTypeEnv();
    typeCheck(ast, typeEnv);

    const valEnv = new TyprValEnv();
    const result = evaluateTypr(ast, valEnv, outputFn);

    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
