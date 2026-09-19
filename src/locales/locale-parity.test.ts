import { describe, expect, it } from 'vitest';
import en from './en.json';
import ro from './ro.json';

/**
 * Locks the maintained locale files (en, ro) together for key parity. de/es/fr were dropped on
 * 2026-09-19; the backend keeps its own bundles.
 *
 * `en.json` is the source of truth (it's also what `TranslationKey` in `hooks/use-translation.ts`
 * is derived from), so a key missing from another locale silently falls back to English rather
 * than failing anything at runtime - this test is what actually catches that instead.
 */
describe('locale parity', () => {
  const enKeys = new Set(Object.keys(en));

  it('ro has every en key, plus only Romanian-specific plural variants', () => {
    const roKeys = new Set(Object.keys(ro));
    const missingFromRo = [...enKeys].filter((k) => !roKeys.has(k));
    expect(missingFromRo, 'keys in en.json missing from ro.json').toEqual([]);

    // Romanian's CLDR plural rule has three categories (one/few/other) where English only has two
    // (one/other), so ro.json legitimately has extra `_few` keys en.json has no equivalent slot for -
    // e.g. `someCount_few` alongside en.json's `someCount_one`/`someCount_other`. Anything else extra
    // is a real orphan/un-carried-rename, same as any other locale.
    const extraInRo = [...roKeys].filter((k) => !enKeys.has(k));
    const unexplainedExtras = extraInRo.filter((k) => !k.endsWith('_few'));
    expect(unexplainedExtras, 'keys in ro.json missing from en.json that are not `_few` plural variants').toEqual(
      [],
    );

    // Every `_few` extra should be a plural variant of a base key en.json actually has (as `_one`
    // and/or `_other`), not a typo'd or orphaned suffix of its own.
    const fewWithoutBase = extraInRo.filter((k) => {
      if (!k.endsWith('_few')) return false;
      const base = k.slice(0, -'_few'.length);
      return !enKeys.has(`${base}_one`) && !enKeys.has(`${base}_other`);
    });
    expect(fewWithoutBase, '`_few` keys in ro.json with no matching `_one`/`_other` base in en.json').toEqual([]);

    // The converse of the check above: every pluralized base in en.json (anything with a `_one`)
    // must have a ro.json `_few` counterpart too, or that count silently renders with `_other`
    // grammar for the 2-19 (and 0) range - the exact bug this test was written after (shopSizeCount
    // had no `_few`, so a facet count of 2 rendered "2 mărimi" -- missing the required Romanian
    // `few` inflection -- via i18next's fallback rather than failing anything).
    const oneBases = [...enKeys]
      .filter((k) => k.endsWith('_one'))
      .map((k) => k.slice(0, -'_one'.length));
    const missingFew = oneBases.filter((base) => !roKeys.has(`${base}_few`));
    expect(missingFew, 'pluralized en.json keys with no `_few` counterpart in ro.json').toEqual([]);
  });
});
