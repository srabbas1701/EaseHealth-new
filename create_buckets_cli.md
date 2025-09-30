# Create Storage Buckets via Supabase CLI

If you have Supabase CLI installed, you can create buckets using the command line:

## Prerequisites
- Supabase CLI installed
- Logged in to Supabase CLI
- Project linked locally

## Commands

```bash
# Create lab-reports bucket
supabase storage create lab-reports --public=false

# Create aadhaar-documents bucket
supabase storage create aadhaar-documents --public=false
```

## Set bucket policies via CLI

```bash
# Set file size limit and MIME types (these might need to be done via dashboard)
# The CLI doesn't support all bucket configuration options
```

## Alternative: Use Supabase Management API

If you have admin access, you can use the Management API:

```bash
curl -X POST 'https://api.supabase.com/v1/projects/{project-id}/storage/buckets' \
  -H "Authorization: Bearer {your-service-role-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "lab-reports",
    "name": "lab-reports",
    "public": false,
    "file_size_limit": 10485760,
    "allowed_mime_types": ["application/pdf", "image/jpeg", "image/jpg"]
  }'

curl -X POST 'https://api.supabase.com/v1/projects/{project-id}/storage/buckets' \
  -H "Authorization: Bearer {your-service-role-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "aadhaar-documents",
    "name": "aadhaar-documents",
    "public": false,
    "file_size_limit": 10485760,
    "allowed_mime_types": ["application/pdf", "image/jpeg", "image/jpg"]
  }'
```

