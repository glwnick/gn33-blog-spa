import { describe, expect, it } from 'vitest';
import en from './en.json';
import ro from './ro.json';
import de from './de.json';
import es from './es.json';
import fr from './fr.json';

/**
 * Locks every locale file (en, ro, de, es, fr) together for full key parity. All five became
 * equally maintained on 2026-08-31, when the owner explicitly retired the earlier "only en/ro,
 * de/es/fr are frozen and fall back to English" policy and had de/es/fr backfilled to match en
 * key-for-key - see `gn33-blog-app`'s analogous `MessageBundleParityTest` for the backend side of
 * the same change.
 *
 * `en.json` is the source of truth (it's also what `TranslationKey` in `hooks/use-translation.ts`
 * is derived from), so a key missing from any other locale silently falls back to English rather
 * than failing anything at runtime - this test is what actually catches that instead.
 */
describe('locale parity', () => {
  const enKeys = new Set(Object.keys(en));

  it.each([
    ['de', de],
    ['es', es],
    ['fr', fr],
  ] as const)('%s has exactly the same keys as en', (_lang, locale) => {
    const localeKeys = new Set(Object.keys(locale));

    const missingFromLocale = [...enKeys].filter((k) => !localeKeys.has(k));
    const missingFromEn = [...localeKeys].filter((k) => !enKeys.has(k));

    expect(missingFromLocale, 'keys in en.json missing from this locale').toEqual([]);
    // A key present in a locale file but not en.json is either a stale/orphaned entry (nothing can
    // reference it - `TranslationKey` is derived from en.json alone) or a rename that carried en.json
    // to a new key name without carrying this locale's translation across too - the same failure
    // mode `MessageBundleParityTest.everyKeyInEnglish_hasAnEquivalentInEveryMaintainedLocale_andViceVersa`
    // guards on the backend.
    expect(missingFromEn, 'keys in this locale missing from en.json (stale, or an un-carried rename)').toEqual([]);
  });

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
