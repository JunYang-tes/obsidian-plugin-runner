import { describe, it, expect } from 'vitest';
import { transform } from './code';

describe('transform', () => {
  it('should wrap the code in a function and add "this." prefix to undeclared variables', () => {
    const sourceCode = 'const a = 1; b = a + 1; console.log(b);';
    const globals = ['console'];
    const expectedCode = `async function () {
  const a = 1;
  this.vars.b = a + 1;
  display(console.log(this.vars.b));
}`;

    const { code, dependencies, provides } = transform(sourceCode, globals);

    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(dependencies).toEqual([]);
    expect(provides).toEqual(['b']);
  });

  it('should add function to this',()=>{
		const sourceCode = 'b = 1; function a(){}'
		const expectedCode = `async function(){this.vars.b=1;display(this.vars.a=functiona(){}.bind(this));}`
    const { code, dependencies, provides } = transform(sourceCode, []);
    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(dependencies).toEqual([]);
    expect(provides).toEqual(['b', 'a']);
	})

  it('should call display with the last expression value', () => {
    const sourceCode = 'const a = 1; a + 1';
    const expectedCode = `async function () {
  const a = 1;
  display(a + 1);
}`;

    const { code, dependencies, provides } = transform(sourceCode);

    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(dependencies).toEqual([]);
    expect(provides).toEqual([]);
  });

  it("should call display with the literal value", () => {
    const sourceCode = '1';
    const expectedCode = `async function () {
   display(1);
  }`
    const { code, dependencies, provides } = transform(sourceCode)
    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(dependencies).toEqual([]);
    expect(provides).toEqual([]);
  })

  it('should transform import statements to await import', () => {
    const sourceCode = `import { a, b } from 'c'; import d from 'e'; import * as f from 'g';`;
    const expectedCode = `async function() {
      const { a, b } = await import('c');
      const { default: d } = await import('e');
      const f = await import('g');
      display(undefined);
    }`;

    const { code, dependencies, provides } = transform(sourceCode);

    expect(code.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    expect(dependencies).toEqual([]);
    expect(provides).toEqual([]);
  });
});


describe('transform dependencies and provides', () => {
  it('should identify a simple dependency', () => {
    const sourceCode = 'const a = b;';
    const { dependencies, provides,code } = transform(sourceCode);
    expect(dependencies).toEqual(['b']);
    expect(provides).toEqual([]);
  });

  it('should identify a simple provide', () => {
    const sourceCode = 'a = 1;';
    const { dependencies, provides } = transform(sourceCode);
    expect(dependencies).toEqual([]);
    expect(provides).toEqual(['a']);
  });

  it('should identify a function provide', () => {
    const sourceCode = 'function a() {}';
    const { dependencies, provides } = transform(sourceCode);
    expect(dependencies).toEqual([]);
    expect(provides).toEqual(['a']);
  });

  it('should handle mixed dependencies and provides', () => {
    const sourceCode = 'a = b + 1; function c() { return d; }';
    const { dependencies, provides } = transform(sourceCode);
    expect(dependencies.sort()).toEqual(['b', 'd'].sort());
    expect(provides.sort()).toEqual(['a', 'c'].sort());
  });
});
