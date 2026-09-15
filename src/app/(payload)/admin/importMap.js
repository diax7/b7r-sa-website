import { EntityHeader as EntityHeader_f6dfb7db6d86b31e8afa488c8e2f837d } from '@/modules/cms/admin/document/entity-header'
import { SavedByField as SavedByField_46120640bb11e96d61a3a62a5294d80c } from '@/modules/cms/admin/fields/saved-by-field'
import { LocaleNote as LocaleNote_9b28d080a4c5ff573d5e4d560dbf06bb } from '@/modules/cms/admin/document/locale-note'
import { RscEntryLexicalCell as RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { RscEntryLexicalField as RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { LexicalDiffComponent as LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { UploadFeatureClient as UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { OrderedListFeatureClient as OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { UnorderedListFeatureClient as UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { BoldFeatureClient as BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { ItalicFeatureClient as ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { HeadingFeatureClient as HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { ParagraphFeatureClient as ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { IconSelect as IconSelect_864a7deb37ea334ede14512c58d1df70 } from '@/modules/cms/admin/fields/icon-select'
import { PlatformSelect as PlatformSelect_13d4e9c129758ea64a712b0ddc9960bb } from '@/modules/cms/admin/fields/platform-select'
import { BlockquoteFeatureClient as BlockquoteFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { PostEngineActions as PostEngineActions_79c14430483a99b8c00d049a212fa9af } from '@/modules/ai-content/admin/post-engine-actions'
import { WarningsField as WarningsField_9c9dd1e32f9fabcc59ef66c800ec3897 } from '@/modules/cms/admin/fields/warnings-field'
import { ImportTopics as ImportTopics_9635d5ea376c57a65f2d6e00b831fcd3 } from '@/modules/ai-content/admin/import-topics'
import { GenerateNow as GenerateNow_955e97df92d42c7d518e6fc933fa2efa } from '@/modules/ai-content/admin/generate-now'
import { EnabledSwitch as EnabledSwitch_03ac396f6de2d0be4878206afb42629c } from '@/modules/cms/admin/fields/enabled-switch'
import { ColorField as ColorField_282b4ad6df406826ab892b1c7d71f9f7 } from '@/modules/cms/admin/fields/color-field'
import { FactsSheetField as FactsSheetField_4b2565ddfaf33dc17fa1b7f1540c1828 } from '@/modules/ai-content/admin/facts-sheet-field'
import { Nav as Nav_3d0835c3ea58bf93ee82386aa839961f } from '@/modules/cms/admin/nav/nav'
import { Icon as Icon_f980e649448e4d4ce46e5f6506a165f6 } from '@/modules/cms/components/logo'
import { Logo as Logo_f980e649448e4d4ce46e5f6506a165f6 } from '@/modules/cms/components/logo'
import { HeaderActions as HeaderActions_76180ddca6c6c307a25397ab3d29d843 } from '@/modules/cms/admin/header/actions'
import { AfterLogin as AfterLogin_bdac64e67aac5daea220280b74983ba7 } from '@/modules/cms/admin/login/after-login'
import { LoginTurnstile as LoginTurnstile_db6d95f00869612066ec723d3905d627 } from '@/modules/cms/auth/login-turnstile'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'
import { Dashboard as Dashboard_c477b09fcf64b52975dc67110214dcbd } from '@/modules/cms/admin/dashboard/dashboard'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "@/modules/cms/admin/document/entity-header#EntityHeader": EntityHeader_f6dfb7db6d86b31e8afa488c8e2f837d,
  "@/modules/cms/admin/fields/saved-by-field#SavedByField": SavedByField_46120640bb11e96d61a3a62a5294d80c,
  "@/modules/cms/admin/document/locale-note#LocaleNote": LocaleNote_9b28d080a4c5ff573d5e4d560dbf06bb,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/rsc#LexicalDiffComponent": LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/client#UploadFeatureClient": UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#LinkFeatureClient": LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#OrderedListFeatureClient": OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#UnorderedListFeatureClient": UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#BoldFeatureClient": BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#ItalicFeatureClient": ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#HeadingFeatureClient": HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#ParagraphFeatureClient": ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@/modules/cms/admin/fields/icon-select#IconSelect": IconSelect_864a7deb37ea334ede14512c58d1df70,
  "@/modules/cms/admin/fields/platform-select#PlatformSelect": PlatformSelect_13d4e9c129758ea64a712b0ddc9960bb,
  "@payloadcms/richtext-lexical/client#BlockquoteFeatureClient": BlockquoteFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@/modules/ai-content/admin/post-engine-actions#PostEngineActions": PostEngineActions_79c14430483a99b8c00d049a212fa9af,
  "@/modules/cms/admin/fields/warnings-field#WarningsField": WarningsField_9c9dd1e32f9fabcc59ef66c800ec3897,
  "@/modules/ai-content/admin/import-topics#ImportTopics": ImportTopics_9635d5ea376c57a65f2d6e00b831fcd3,
  "@/modules/ai-content/admin/generate-now#GenerateNow": GenerateNow_955e97df92d42c7d518e6fc933fa2efa,
  "@/modules/cms/admin/fields/enabled-switch#EnabledSwitch": EnabledSwitch_03ac396f6de2d0be4878206afb42629c,
  "@/modules/cms/admin/fields/color-field#ColorField": ColorField_282b4ad6df406826ab892b1c7d71f9f7,
  "@/modules/ai-content/admin/facts-sheet-field#FactsSheetField": FactsSheetField_4b2565ddfaf33dc17fa1b7f1540c1828,
  "@/modules/cms/admin/nav/nav#Nav": Nav_3d0835c3ea58bf93ee82386aa839961f,
  "@/modules/cms/components/logo#Icon": Icon_f980e649448e4d4ce46e5f6506a165f6,
  "@/modules/cms/components/logo#Logo": Logo_f980e649448e4d4ce46e5f6506a165f6,
  "@/modules/cms/admin/header/actions#HeaderActions": HeaderActions_76180ddca6c6c307a25397ab3d29d843,
  "@/modules/cms/admin/login/after-login#AfterLogin": AfterLogin_bdac64e67aac5daea220280b74983ba7,
  "@/modules/cms/auth/login-turnstile#LoginTurnstile": LoginTurnstile_db6d95f00869612066ec723d3905d627,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
  "@/modules/cms/admin/dashboard/dashboard#Dashboard": Dashboard_c477b09fcf64b52975dc67110214dcbd,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
