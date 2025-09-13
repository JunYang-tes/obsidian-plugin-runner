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
    it('should add function to this', () => {
        const sourceCode = 'b = 1; function a(){}';
        const expectedCode = `async function(){this.b=1;display(this.a=functiona(){});}`;
        const result = transform(sourceCode, []);
        expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    });
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
  }`;
        const result = transform(sourceCode);
        expect(result.replace(/\s/g, '')).toBe(expectedCode.replace(/\s/g, ''));
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29kZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUM5QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBRW5DLFFBQVEsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO0lBQ3pCLEVBQUUsQ0FBQyxtRkFBbUYsRUFBRSxHQUFHLEVBQUU7UUFDM0YsTUFBTSxVQUFVLEdBQUcseUNBQXlDLENBQUM7UUFDN0QsTUFBTSxPQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM1QixNQUFNLFlBQVksR0FBRzs7OztFQUl2QixDQUFDO1FBRUMsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUU5QyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxRSxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw2QkFBNkIsRUFBQyxHQUFFLEVBQUU7UUFDckMsTUFBTSxVQUFVLEdBQUcsdUJBQXVCLENBQUE7UUFDMUMsTUFBTSxZQUFZLEdBQUcsMkRBQTJELENBQUE7UUFDOUUsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDLENBQUMsQ0FBQTtJQUVELEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxHQUFHLEVBQUU7UUFDNUQsTUFBTSxVQUFVLEdBQUcsb0JBQW9CLENBQUM7UUFDeEMsTUFBTSxZQUFZLEdBQUc7OztFQUd2QixDQUFDO1FBRUMsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXJDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzFFLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDRDQUE0QyxFQUFFLEdBQUcsRUFBRTtRQUNwRCxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUM7UUFDdkIsTUFBTSxZQUFZLEdBQUc7O0lBRXJCLENBQUE7UUFDQSxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDcEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDMUUsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsb0RBQW9ELEVBQUUsR0FBRyxFQUFFO1FBQzVELE1BQU0sVUFBVSxHQUFHLHNFQUFzRSxDQUFDO1FBQzFGLE1BQU0sWUFBWSxHQUFHOzs7OztNQUtuQixDQUFDO1FBRUgsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXJDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzFFLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZXNjcmliZSwgaXQsIGV4cGVjdCB9IGZyb20gJ3ZpdGVzdCc7XG5pbXBvcnQgeyB0cmFuc2Zvcm0gfSBmcm9tICcuL2NvZGUnO1xuXG5kZXNjcmliZSgndHJhbnNmb3JtJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHdyYXAgdGhlIGNvZGUgaW4gYSBmdW5jdGlvbiBhbmQgYWRkIFwidGhpcy5cIiBwcmVmaXggdG8gdW5kZWNsYXJlZCB2YXJpYWJsZXMnLCAoKSA9PiB7XG4gICAgY29uc3Qgc291cmNlQ29kZSA9ICdjb25zdCBhID0gMTsgYiA9IGEgKyAxOyBjb25zb2xlLmxvZyhiKTsnO1xuICAgIGNvbnN0IGdsb2JhbHMgPSBbJ2NvbnNvbGUnXTtcbiAgICBjb25zdCBleHBlY3RlZENvZGUgPSBgYXN5bmMgZnVuY3Rpb24gKCkge1xuICBjb25zdCBhID0gMTtcbiAgdGhpcy5iID0gYSArIDE7XG4gIGRpc3BsYXkoY29uc29sZS5sb2codGhpcy5iKSk7XG59YDtcblxuICAgIGNvbnN0IHJlc3VsdCA9IHRyYW5zZm9ybShzb3VyY2VDb2RlLCBnbG9iYWxzKTtcblxuICAgIGV4cGVjdChyZXN1bHQucmVwbGFjZSgvXFxzL2csICcnKSkudG9CZShleHBlY3RlZENvZGUucmVwbGFjZSgvXFxzL2csICcnKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgYWRkIGZ1bmN0aW9uIHRvIHRoaXMnLCgpPT57XG5cdFx0Y29uc3Qgc291cmNlQ29kZSA9ICdiID0gMTsgZnVuY3Rpb24gYSgpe30nXG5cdFx0Y29uc3QgZXhwZWN0ZWRDb2RlID0gYGFzeW5jIGZ1bmN0aW9uKCl7dGhpcy5iPTE7ZGlzcGxheSh0aGlzLmE9ZnVuY3Rpb25hKCl7fSk7fWBcbiAgICBjb25zdCByZXN1bHQgPSB0cmFuc2Zvcm0oc291cmNlQ29kZSwgW10pO1xuICAgIGV4cGVjdChyZXN1bHQucmVwbGFjZSgvXFxzL2csICcnKSkudG9CZShleHBlY3RlZENvZGUucmVwbGFjZSgvXFxzL2csICcnKSk7XG5cdH0pXG5cbiAgaXQoJ3Nob3VsZCBjYWxsIGRpc3BsYXkgd2l0aCB0aGUgbGFzdCBleHByZXNzaW9uIHZhbHVlJywgKCkgPT4ge1xuICAgIGNvbnN0IHNvdXJjZUNvZGUgPSAnY29uc3QgYSA9IDE7IGEgKyAxJztcbiAgICBjb25zdCBleHBlY3RlZENvZGUgPSBgYXN5bmMgZnVuY3Rpb24gKCkge1xuICBjb25zdCBhID0gMTtcbiAgZGlzcGxheShhICsgMSk7XG59YDtcblxuICAgIGNvbnN0IHJlc3VsdCA9IHRyYW5zZm9ybShzb3VyY2VDb2RlKTtcblxuICAgIGV4cGVjdChyZXN1bHQucmVwbGFjZSgvXFxzL2csICcnKSkudG9CZShleHBlY3RlZENvZGUucmVwbGFjZSgvXFxzL2csICcnKSk7XG4gIH0pO1xuXG4gIGl0KFwic2hvdWxkIGNhbGwgZGlzcGxheSB3aXRoIHRoZSBsaXRlcmFsIHZhbHVlXCIsICgpID0+IHtcbiAgICBjb25zdCBzb3VyY2VDb2RlID0gJzEnO1xuICAgIGNvbnN0IGV4cGVjdGVkQ29kZSA9IGBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICBkaXNwbGF5KDEpO1xuICB9YFxuICAgIGNvbnN0IHJlc3VsdCA9IHRyYW5zZm9ybShzb3VyY2VDb2RlKVxuICAgIGV4cGVjdChyZXN1bHQucmVwbGFjZSgvXFxzL2csICcnKSkudG9CZShleHBlY3RlZENvZGUucmVwbGFjZSgvXFxzL2csICcnKSk7XG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCB0cmFuc2Zvcm0gaW1wb3J0IHN0YXRlbWVudHMgdG8gYXdhaXQgaW1wb3J0JywgKCkgPT4ge1xuICAgIGNvbnN0IHNvdXJjZUNvZGUgPSBgaW1wb3J0IHsgYSwgYiB9IGZyb20gJ2MnOyBpbXBvcnQgZCBmcm9tICdlJzsgaW1wb3J0ICogYXMgZiBmcm9tICdnJztgO1xuICAgIGNvbnN0IGV4cGVjdGVkQ29kZSA9IGBhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IHsgYSwgYiB9ID0gYXdhaXQgaW1wb3J0KCdjJyk7XG4gICAgICBjb25zdCB7IGRlZmF1bHQ6IGQgfSA9IGF3YWl0IGltcG9ydCgnZScpO1xuICAgICAgY29uc3QgZiA9IGF3YWl0IGltcG9ydCgnZycpO1xuICAgICAgZGlzcGxheSh1bmRlZmluZWQpO1xuICAgIH1gO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gdHJhbnNmb3JtKHNvdXJjZUNvZGUpO1xuXG4gICAgZXhwZWN0KHJlc3VsdC5yZXBsYWNlKC9cXHMvZywgJycpKS50b0JlKGV4cGVjdGVkQ29kZS5yZXBsYWNlKC9cXHMvZywgJycpKTtcbiAgfSk7XG59KTtcbiJdfQ==