/* 0.91.2 */import { Selector } from 'mathlive';
import type { VirtualKeyboardOptions, AlphabeticKeyboardLayout, VirtualKeyboardLayer, VirtualKeyboardLayout, EditToolbarOptions, VirtualKeyboardKeycap } from './virtual-keyboard';
export interface MathfieldProxy {
    value: string;
    readonly selectionIsCollapsed: boolean;
    readonly canUndo: boolean;
    readonly canRedo: boolean;
}
/**
 * This interface is implemented by:
 * - `VirtualKeyboard`: when the browsing context is a top-level document
 * - `VirtualKeyboardProxy`: when the browsing context is an iframe
 */
export interface VirtualKeyboardInterface extends VirtualKeyboardOptions {
    show(options?: {
        animate: boolean;
    }): void;
    hide(options?: {
        animate: boolean;
    }): void;
    visible: boolean;
    readonly boundingRect: DOMRect;
    executeCommand(command: string | [string, ...any[]]): boolean;
    /** The content or selection of the mathfield has changed and the toolbar
     * may need to be updated accordingly
     */
    updateToolbar(mf: MathfieldProxy): void;
    connect(): void;
    disconnect(): void;
}
export interface VirtualKeyboardCommands {
    /**
     * The command invoked when a variant key is pressed:
     * hide the variants panel, then perform the command.
     */
    performVariant: (command: Selector | [Selector, ...any[]]) => boolean;
    switchKeyboardLayer: (layer: string) => boolean;
    toggleVirtualKeyboard: () => boolean;
    hideVirtualKeyboard: () => boolean;
    showVirtualKeyboard: () => boolean;
}
export type VirtualKeyboardMessageAction = 'connect' | 'disconnect' | 'proxy-created' | 'execute-command' | 'show' | 'hide' | 'update-setting' | 'update-toolbar' | 'synchronize-proxy' | 'geometry-changed' | 'update-state' | 'focus' | 'blur';
export type VirtualKeyboardMessage = {
    type: 'mathlive#virtual-keyboard-message';
    action: 'execute-command';
    command: Selector | [Selector, ...any[]];
} | {
    type: 'mathlive#virtual-keyboard-message';
    action: 'geometry-changed';
    boundingRect: DOMRect;
} | {
    type: 'mathlive#virtual-keyboard-message';
    action: 'synchronize-proxy';
    boundingRect: DOMRect;
    alphabeticLayout?: AlphabeticKeyboardLayout;
    layers: Record<string, string | Partial<VirtualKeyboardLayer>>;
    layouts: (string | VirtualKeyboardLayout)[];
    editToolbar?: EditToolbarOptions;
    actionKeycap: string | Partial<VirtualKeyboardKeycap>;
    shiftKeycap: string | Partial<VirtualKeyboardKeycap>;
    backspaceKeycap: string | Partial<VirtualKeyboardKeycap>;
    tabKeycap: string | Partial<VirtualKeyboardKeycap>;
} | {
    type: 'mathlive#virtual-keyboard-message';
    action: 'update-setting';
    alphabeticLayout?: AlphabeticKeyboardLayout;
    layers: Record<string, string | Partial<VirtualKeyboardLayer>>;
    layouts: (string | VirtualKeyboardLayout)[];
    editToolbar?: EditToolbarOptions;
    actionKeycap: string | Partial<VirtualKeyboardKeycap>;
    shiftKeycap: string | Partial<VirtualKeyboardKeycap>;
    backspaceKeycap: string | Partial<VirtualKeyboardKeycap>;
    tabKeycap: string | Partial<VirtualKeyboardKeycap>;
} | {
    type: 'mathlive#virtual-keyboard-message';
    action: 'show' | 'hide';
    animate?: boolean;
} | {
    type: 'mathlive#virtual-keyboard-message';
    action: 'connect' | 'disconnect' | 'proxy-created' | 'focus' | 'blur' | 'update-state' | 'update-toolbar';
};
