import { describe, it, expect, vi } from 'vitest';
import { Runner } from './runner';

describe('Runner', () => {
  it('should run a single code block and call display', async () => {
    const runner = new Runner();
    const display = vi.fn();
    const sourceCode = '1 + 2';
    
    await runner.run(sourceCode, 'block1', 'doc1', display);
    
    expect(display).toHaveBeenCalledWith(3);
  });

  it('should handle dependencies between code blocks', async () => {
    const runner = new Runner();
    const display1 = vi.fn();
    const display2 = vi.fn();

    await runner.run('a = 10', 'block1', 'doc1', display1);
    
    await runner.run('a + 5', 'block2', 'doc1', display2);
    expect(display2).toHaveBeenCalledWith(15);
  });

  it('should make variables from dependencies available', async () => {
    const runner = new Runner();
    const display1 = vi.fn();
    const display2 = vi.fn();

    await runner.run('a = 10', 'block1', 'doc1', display1);
    await runner.run('const b = a + 5; b', 'block2', 'doc1', display2);
    
    expect(display2).toHaveBeenCalledWith(15);
  });

  it.skip('should throw an error for circular dependencies', async () => {
    const runner = new Runner();
    const disp = vi.fn();
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // blockA depends on 'b', blockB provides 'b' but depends on 'a', blockA provides 'a'.
    await runner.run('a = b', 'blockA', 'doc1', disp);
    await runner.run('b = a', 'blockB', 'doc1', disp);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const error = consoleErrorSpy.mock.calls[0][0] as Error;
    expect(error.message).toContain('Circular execution detected at block: blockB');
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle multiple dependencies', async () => {
    const runner = new Runner();
    const displays = {
      a: vi.fn(),
      b: vi.fn(),
      c: vi.fn(),
    };

    await runner.run('a = 1', 'blockA', 'doc1', displays.a);
    await runner.run('b = 2', 'blockB', 'doc1', displays.b);
    await runner.run('a + b', 'blockC', 'doc1', displays.c);

    expect(displays.c).toHaveBeenCalledWith(3);
  });

  it('should re-run dependencies to get latest values', async () => {
    const runner = new Runner();
    const displays = {
      a: vi.fn(),
      b: vi.fn(),
    };

    await runner.run('a = 1', 'blockA', 'doc1', displays.a);
    await runner.run('a + 1', 'blockB', 'doc1', displays.b);
    expect(displays.b).toHaveBeenCalledWith(2);

    // Update blockA
    await runner.run('a = 100', 'blockA', 'doc1', displays.a);

    // Re-run blockB, it should pick up the new value of 'a'
    // by re-running blockA as a dependency.
    displays.b.mockClear();
    await runner.run('a + 1', 'blockB', 'doc1', displays.b);
    expect(displays.b).toHaveBeenCalledWith(101);
  });

  it('should handle functions using shared variables', async () => {
    const runner = new Runner();
    const display = vi.fn();

    // Block 1: define a variable 'a'
    await runner.run('a = 10', 'block1', 'doc1', display);

    // Block 2: define a function 'myFunc' that uses 'a'
    const funcSrc = `function myFunc() { return a + 5; }`;
    await runner.run(funcSrc, 'block2', 'doc1', display);

    // Block 3: call the function
    await runner.run('myFunc()', 'block3', 'doc1', display);

    // The display function from block3 should be called with the result of myFunc()
    expect(display).toHaveBeenCalledWith(15);
  });

  it('should isolate variables between different docs', async () => {
    const runner = new Runner();
    const displayDoc1 = vi.fn();
    const displayDoc2 = vi.fn();

    // Define 'a' in doc1
    await runner.run('a = 10', 'block1', 'doc1', vi.fn());
    
    // Define 'a' in doc2
    await runner.run('a = 20', 'block1', 'doc2', vi.fn());

    // Use 'a' in doc1
    await runner.run('a + 5', 'block2', 'doc1', displayDoc1);
    expect(displayDoc1).toHaveBeenCalledWith(15);

    // Use 'a' in doc2
    await runner.run('a + 5', 'block2', 'doc2', displayDoc2);
    expect(displayDoc2).toHaveBeenCalledWith(25);
  });
});