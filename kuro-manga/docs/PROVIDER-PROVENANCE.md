# Provider discovery provenance

Names, current address hints, website-family names and selector/path facts were inspected in the Keiyoushi extension source repository, commit `e97033fe901ebd52964577d869b4549f65028cb0` (https://github.com/keiyoushi/extensions-source), licensed Apache 2.0. The applicable license is preserved in `KEIYOUSHI-APACHE-2.0.txt`.

KURO's JavaScript implementations were written against public provider responses and its own server/reader contracts. No remote extension is executed or automatically trusted at runtime. Static host admission followed selected direct catalogue/title/chapter/image checks. Discovery hints and live access outcomes are separately recorded in `PROVIDER-AUDIT.json`. No upstream manga image collection, private credentials, or entire extension repository is included in the release.
