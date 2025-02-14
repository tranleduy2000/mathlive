import type { Variant, VariantStyle, Style } from '../public/core-types';
import type { GlobalContext } from 'core/types';

import { Atom, AtomJson, AtomType, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { joinLatex } from '../core/tokenizer';
import { AXIS_HEIGHT } from '../core/font-metrics';

/**
 * Operators are handled in the TeXbook pg. 443-444, rule 13(a).
 */
export class OperatorAtom extends Atom {
  private readonly variant?: Variant;
  private readonly variantStyle?: VariantStyle;
  private readonly hasArgument: boolean;

  constructor(
    command: string,
    symbol: string | Atom[],
    context: GlobalContext,
    options: {
      type?: AtomType;
      isExtensibleSymbol?: boolean;
      isFunction?: boolean;
      hasArgument?: boolean;
      captureSelection?: boolean;
      // Unlike `style`, `variant` and `variantStyle` are applied to the
      // content of this atom, but not propagated to the next atom
      variant?: Variant;
      variantStyle?: VariantStyle;
      limits?: 'auto' | 'over-under' | 'adjacent';
      style?: Style;
    }
  ) {
    super(options.type ?? 'mop', context, {
      command,
      style: options.style,
      isFunction: options?.isFunction,
    });
    if (typeof symbol === 'string') this.value = symbol;
    else this.body = symbol;

    this.captureSelection = options.captureSelection ?? false;

    this.hasArgument = options.hasArgument ?? false;
    this.variant = options?.variant;
    this.variantStyle = options?.variantStyle;
    this.subsupPlacement = options?.limits;
    this.isExtensibleSymbol = options?.isExtensibleSymbol ?? false;
  }

  static fromJson(json: AtomJson, context: GlobalContext): OperatorAtom {
    return new OperatorAtom(
      json.command,
      json.body ? json.body : json.value,
      context,
      json as any
    );
  }

  toJson(): AtomJson {
    const result = super.toJson();

    if (this.hasArgument) result.hasArgument = true;
    if (this.variant) result.variant = this.variant;
    if (this.variantStyle) result.variantStyle = this.variantStyle;
    if (this.subsupPlacement) result.limits = this.subsupPlacement;
    if (this.isExtensibleSymbol) result.isExtensibleSymbol = true;
    if (this.value) result.symbol = this.value;
    return result;
  }

  render(context: Context): Box | null {
    let base: Box | null;
    let baseShift = 0;
    let slant = 0;
    if (this.isExtensibleSymbol) {
      // Most symbol operators get larger in displaystyle (rule 13)
      // except `\smallint`
      const large = context.isDisplayStyle && this.value !== '\\smallint';

      base = new Box(this.value, {
        fontFamily: large ? 'Size2-Regular' : 'Size1-Regular',
        classes: 'op-symbol ' + (large ? 'large-op' : 'small-op'),
        type: 'mop',
        maxFontSize: context.scalingFactor,
      });

      if (!base) return null;

      // Apply italic correction
      base.right = base.italic;

      // Shift the symbol so its center lies on the axis (rule 13). It
      // appears that our fonts have the centers of the symbols already
      // almost on the axis, so these numbers are very small. Note we
      // don't actually apply this here, but instead it is used either in
      // the vlist creation or separately when there are no limits.
      baseShift =
        (base.height - base.depth) / 2 - AXIS_HEIGHT * context.scalingFactor;

      // The slant of the symbol is just its italic correction.
      slant = base.italic;
      base.setStyle('color', this.style.color);
      base.setStyle('background-color', this.style.backgroundColor);
    } else if (this.body) {
      // If this is a list, decompose that list.
      base = Atom.createBox(context, this.body, { newList: true });

      if (!base) return null;

      base.setStyle('color', this.style.color);
      base.setStyle('background-color', this.style.backgroundColor);
    } else {
      // Otherwise, this is a text operator. Build the text from the
      // operator's name.
      console.assert(this.type === 'mop');
      // Not all styles are applied, since the operators have a distinct
      // appearance (for example, can't override their font family)
      base = new Box(this.value, {
        type: 'mop',
        mode: 'math',
        maxFontSize: context.scalingFactor,
        style: {
          color: this.style.color,
          backgroundColor: this.style.backgroundColor,
          letterShapeStyle: context.letterShapeStyle,
          variant: this.variant,
          variantStyle: this.variantStyle,
        },
      });
    }

    if (this.isExtensibleSymbol) base.setTop(baseShift);
    let result = base;
    if (this.superscript || this.subscript) {
      const limits = this.subsupPlacement ?? 'auto';
      result =
        limits === 'over-under' || (limits === 'auto' && context.isDisplayStyle)
          ? this.attachLimits(context, { base, baseShift, slant })
          : this.attachSupsub(context, { base });
    }

    if (this.caret) result.caret = this.caret;

    // Bind the generated box with its limits so they
    // can all be selected as one
    return new Box(this.bind(context, result), {
      type: 'mop',
      classes: 'op-group' + (this.isSelected ? ' ML__selected' : ''),
    });
  }

  serialize(options: ToLatexOptions): string {
    // ZERO-WIDTH?
    if (this.value === '\u200B') return this.supsubToLatex(options);

    const result: string[] = [];
    result.push(this.command!);
    if (this.hasArgument) result.push(`{${this.bodyToLatex(options)}}`);
    if (this.explicitSubsupPlacement) {
      if (this.subsupPlacement === 'over-under') result.push('\\limits');
      if (this.subsupPlacement === 'adjacent') result.push('\\nolimits');
      if (this.subsupPlacement === 'auto') result.push('\\displaylimits');
    }

    result.push(this.supsubToLatex(options));
    return joinLatex(result);
  }
}
