import { describe, it, expect } from 'vitest';
import { parse } from '../../../src/scripts/os/terminal/commands';

describe('parse', () => {
  it('parses a simple command', () => {
    const result = parse('echo hello world');
    expect(result.cmd).toBe('echo');
    expect(result.args).toEqual(['hello', 'world']);
    expect(result.flags).toEqual({});
  });

  it('parses long flags', () => {
    const result = parse('skills --top=5');
    expect(result.cmd).toBe('skills');
    expect(result.flags.top).toBe('5');
  });

  it('parses boolean long flags', () => {
    const result = parse('ls --all');
    expect(result.cmd).toBe('ls');
    expect(result.flags.all).toBe(true);
  });

  it('parses short flags as individual characters', () => {
    const result = parse('uname -a');
    expect(result.cmd).toBe('uname');
    expect(result.flags.a).toBe(true);
  });

  it('parses combined short flags', () => {
    const result = parse('rm -rf dir');
    expect(result.cmd).toBe('rm');
    expect(result.flags.r).toBe(true);
    expect(result.flags.f).toBe(true);
    expect(result.args).toEqual(['dir']);
  });

  it('returns empty cmd for empty input', () => {
    const result = parse('');
    expect(result.cmd).toBe('');
    expect(result.args).toEqual([]);
  });
});
