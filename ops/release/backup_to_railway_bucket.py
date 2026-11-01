#!/usr/bin/env python3
import hashlib
import os
import pathlib
import shutil
import sys
import uuid
from datetime import datetime, timezone

import boto3
from botocore.config import Config

def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as file:
        while chunk := file.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()

def main():
    source = pathlib.Path("/tmp/mediaos-production-clone/source.dump")
    retrieved = pathlib.Path("/tmp/mediaos-production-clone/recovered.dump")
    if os.environ.get("RAILWAY_ENVIRONMENT_NAME") != "production":
        raise RuntimeError("Only the production recovery workflow can archive this dump")
    if not source.is_file() or source.stat().st_size < 1024:
        raise RuntimeError("Backup file is missing or suspiciously small")
    if not os.environ.get("BACKUP_ENDPOINT", "").startswith("https://"):
        raise RuntimeError("HTTPS S3 endpoint is required")
    bucket = os.environ["BACKUP_BUCKET"]
    if not bucket.startswith("mediaos-production-recovery-"):
        raise RuntimeError("Refusing unexpected destination bucket")
    s3 = boto3.client(
        "s3",
        endpoint_url=os.environ["BACKUP_ENDPOINT"],
        region_name=os.environ["BACKUP_REGION"],
        aws_access_key_id=os.environ["BACKUP_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["BACKUP_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"},
                      retries={"max_attempts": 3, "mode": "standard"}),
    )
    original_hash = digest(source)
    size = source.stat().st_size
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    key = f"postgres/backups/production-v85-{timestamp}-{uuid.uuid4().hex}.dump"
    s3.upload_file(
        str(source), bucket, key,
        ExtraArgs={"Metadata": {"sha256": original_hash, "source": "mediaos-production-v85"}}
    )
    head = s3.head_object(Bucket=bucket, Key=key)
    if head["ContentLength"] != size or head.get("Metadata", {}).get("sha256") != original_hash:
        raise RuntimeError("Remote backup metadata verification failed")
    print("DURABLE_PRIVATE_S3_BACKUP_UPLOAD=PASS", flush=True)
    s3.download_file(bucket, key, str(retrieved))
    if digest(retrieved) != original_hash or retrieved.stat().st_size != size:
        raise RuntimeError("Downloaded backup does not match uploaded backup")
    os.replace(retrieved, source)
    print("DURABLE_PRIVATE_S3_BACKUP_REDOWNLOAD_SHA256=PASS", flush=True)
    print("BACKUP_OBJECT_KEY=" + key, flush=True)
    print("BACKUP_SHA256=" + original_hash, flush=True)
    print("BACKUP_BYTES=" + str(size), flush=True)

if __name__ == "__main__":
    main()
