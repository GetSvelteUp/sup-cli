#!/bin/bash

WORKDIR="$PWD"
TEMPDIR="$WORKDIR/.tmp"

MACHINE_TYPE=`uname -m`
TARGET="aarch64-unknown-linux-musl"
LINKER="$TARGET-gcc"

GITHUB_API_REPOS_BASE_URL="https://api.github.com/repos"

SCCACHE_RELEASE_INFO_URL="$GITHUB_API_REPOS_BASE_URL/mozilla/sccache/releases/latest"
SCCACHE_DOWNLOAD_DIR="$TEMPDIR/sccache"
SCCACHE_BINARY=""

rm -rf $TEMPDIR && mkdir -p $TEMPDIR
mkdir -p $SCCACHE_DOWNLOAD_DIR 

if [[ "$OSTYPE" == "darwin"* ]]; then 
    brew tap SergioBenitez/osxct --quiet
    brew install $TARGET wget jq --quiet

    export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_MUSL_LINKER="$LINKER"

    if [[ "$MACHINE_TYPE" == "arm64" ]]; then 
        SCCACHE_BINARY="sccache-v0.2.15-aarch64-apple-darwin"
    else
        SCCACHE_BINARY="sccache-v0.2.15-x86_64-apple-darwin"
    fi

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then 

  if [[ "$MACHINE_TYPE" == "arm64" ]]; then 
        SCCACHE_BINARY="sccache-v0.2.15-aarch64-unknown-linux-musl"
    else
        SCCACHE_BINARY="sccache-v0.2.15-x86_64-unknown-linux-musl"
    fi
fi 

cd $SCCACHE_DOWNLOAD_DIR 

curl -s "$SCCACHE_RELEASE_INFO_URL" | jq -r ".assets[] | select(.name | contains(\"$SCCACHE_BINARY\")) | .browser_download_url" | wget -q -i -
tar -xf "$SCCACHE_DOWNLOAD_DIR/$SCCACHE_BINARY.tar.gz"  
mkdir -p $TEMPDIR/bin && mv $SCCACHE_BINARY/* $TEMPDIR/bin

chmod +x $TEMPDIR/bin/*

cd $WORKDIR

echo ""

export RUSTC_WRAPPER="$TEMPDIR/bin/sccache"

rustup target add $TARGET 

for CONFIG in $(find ./assets/rs -maxdepth 2 -name Cargo.toml)
do 
    PACKAGE_NAME=$(toml get $CONFIG package.name)
    PACKAGE_NAME=$(eval "echo $PACKAGE_NAME")
    TARGET_DIR="target/$PACKAGE_NAME"
    CDK_DIR="build/assets/rs/$PACKAGE_NAME"
    cargo build --release \
        --target $TARGET \
        --package $PACKAGE_NAME \
        --target-dir $TARGET_DIR \
        # --quiet
    mkdir -p "$CDK_DIR"
    cp "$TARGET_DIR/$TARGET/release/bootstrap" "$CDK_DIR"
done 


