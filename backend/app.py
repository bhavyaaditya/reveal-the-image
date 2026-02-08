# docker image's name is `reveal-backend`

# Deploy using this script/command from /backend: `./.deploy.sh`
from flask import Flask, jsonify
from google.cloud import storage
from flask_cors import CORS

from datetime import timedelta
from google.auth import default
from google.auth.iam import Signer
from google.auth.transport.requests import Request

app = Flask(__name__)
CORS(app)

BUCKET_NAME = "reveal-image-assets"

@app.route("/health")
def health():
    return jsonify({"status":"ok", "via":"cloud-build"}), 200

@app.route("/images", methods=["GET"])
def images():
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)

    #! Get Cloud Run credentials (token-based)
    credentials, project = default()
    #! Get service account details
    service_account_email = credentials.service_account_email
    print("#>#>#>--->>> Signing as:", service_account_email)
    if not service_account_email:
        raise RuntimeError("#>#>#>--->>> Service account email not available.")
    #! Create IAM Signer
    request=Request()   # Transport object bound to the signer
    signer = Signer(
        credentials=credentials,
        service_account_email=service_account_email,
        request=request,
    )

    image_list = []

    for blob in bucket.list_blobs():
        if blob.content_type and blob.content_type.startswith("image/"):
            signed_url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(minutes=5),
                method="GET",
                service_account_email=service_account_email,
                signer=signer,
            )

            image_list.append({
                "name":blob.name,
                "url":signed_url,
            })

    return jsonify({
        "count": len(image_list),
        "images": image_list
    }), 200

if __name__=="__main__":
    app.run(
        host = "0.0.0.0",
        port = 8080,
        debug = True,
    )