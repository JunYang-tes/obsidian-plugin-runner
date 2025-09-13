import { describe, it, expect } from 'vitest';
import { transform } from './code';

describe('transform', () => {
  it('should wrap the code in a function and add "this." prefix to undeclared variables', () => {
    const sourceCode = 'const a = 1; b = a + 1; console.log(b);';
    const globals = ['console'];
    const expectedCode = `async function () {
  const a = 1;
  this.b = a + 1;
  display(console.log(this.b));
}`;

    const result = transform(sourceCode, globals);

    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
  });

  it('should add function to this',()=>{
		const sourceCode = 'b = 1; function a(){}'
		const expectedCode = `async function(){this.b=1;display(this.a=functiona(){});}`
    const result = transform(sourceCode, []);
    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
	})

  it('should call display with the last expression value', () => {
    const sourceCode = 'const a = 1; a + 1';
    const expectedCode = `async function () {
  const a = 1;
  display(a + 1);
}`;

    const result = transform(sourceCode);

    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
  });

  it("should call display with the literal value", () => {
    const sourceCode = '1';
    const expectedCode = `async function () {
   display(1);
  }`
    const result = transform(sourceCode)
    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
  })

  it('should transform import statements to await import', () => {
    const sourceCode = `import { a, b } from 'c'; import d from 'e'; import * as f from 'g';`;
    const expectedCode = `async function() {
      const { a, b } = await import('c');
      const { default: d } = await import('e');
      const f = await import('g');
      display(undefined);
    }`;

    const result = transform(sourceCode);

    expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
  });
});
