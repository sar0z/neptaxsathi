/**
 * Safely evaluates a basic mathematical expression (containing +, -, *, /)
 * without using eval(). Respects operator precedence (* and / before + and -).
 */
export function evaluateExpression(expression: string): number {
  // Normalize operators and remove spaces
  const normalized = expression.replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");

  const tokens: string[] = [];
  let currentToken = "";

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    
    // Check if '-' represents a negative number or subtraction operator
    if (char === "-") {
      const prevChar = tokens[tokens.length - 1];
      const isOperator = !prevChar || ["+", "-", "*", "/"].includes(prevChar);
      if (isOperator && currentToken === "") {
        // It's a negative sign, start a negative number
        currentToken += char;
        continue;
      }
    }

    if (["+", "-", "*", "/"].includes(char)) {
      if (currentToken !== "") {
        tokens.push(currentToken);
        currentToken = "";
      }
      tokens.push(char);
    } else {
      currentToken += char;
    }
  }

  if (currentToken !== "") {
    tokens.push(currentToken);
  }

  if (tokens.length === 0) return 0;

  // First pass: perform multiplication and division
  const pass1: (string | number)[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === "*" || token === "/") {
      const prev = pass1.pop();
      const nextStr = tokens[i + 1];
      if (prev === undefined || nextStr === undefined) {
        throw new Error("Invalid expression");
      }
      const prevVal = typeof prev === "number" ? prev : parseFloat(prev);
      const nextVal = parseFloat(nextStr);
      if (isNaN(prevVal) || isNaN(nextVal)) {
        throw new Error("Invalid number");
      }
      
      if (token === "*") {
        pass1.push(prevVal * nextVal);
      } else {
        if (nextVal === 0) {
          throw new Error("Division by zero");
        }
        pass1.push(prevVal / nextVal);
      }
      i += 2;
    } else {
      pass1.push(token);
      i++;
    }
  }

  // Second pass: perform addition and subtraction
  if (pass1.length === 0) return 0;
  let result = typeof pass1[0] === "number" ? pass1[0] : parseFloat(pass1[0]);
  if (isNaN(result)) {
    throw new Error("Invalid number");
  }

  let j = 1;
  while (j < pass1.length) {
    const op = pass1[j];
    const nextVal = pass1[j + 1];
    if (nextVal === undefined) {
      throw new Error("Invalid expression");
    }
    const nextNum = typeof nextVal === "number" ? nextVal : parseFloat(nextVal);
    if (isNaN(nextNum)) {
      throw new Error("Invalid number");
    }

    if (op === "+") {
      result += nextNum;
    } else if (op === "-") {
      result -= nextNum;
    } else {
      throw new Error("Unknown operator: " + op);
    }
    j += 2;
  }

  return result;
}
