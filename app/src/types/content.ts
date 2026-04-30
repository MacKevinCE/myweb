import type { ProfileBase, ProfileContent } from './profile';
import type { UiBase, SharedUi, TerminalUi, OsUi, LiquidGlassUi } from './ui';

/**
 * Merged content produced by deepMerge of:
 * ProfileBase + ProfileContent + UiBase + SharedUi + theme-specific UI
 */
type MergedContent<T> = ProfileBase & ProfileContent & UiBase & SharedUi & T;

export type TerminalContent = MergedContent<TerminalUi>;
export type OsContent = MergedContent<OsUi>;
export type LiquidGlassContent = MergedContent<LiquidGlassUi>;

export type ThemeContent = TerminalContent | OsContent | LiquidGlassContent;
