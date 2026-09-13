import { Icon as Icon_f980e649448e4d4ce46e5f6506a165f6 } from '@/modules/cms/components/logo'
import { Logo as Logo_f980e649448e4d4ce46e5f6506a165f6 } from '@/modules/cms/components/logo'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "@/modules/cms/components/logo#Icon": Icon_f980e649448e4d4ce46e5f6506a165f6,
  "@/modules/cms/components/logo#Logo": Logo_f980e649448e4d4ce46e5f6506a165f6,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
