cd node_modules/local-dynamo/aws_dynamodb_local
if [ -f libsqlite4java-osx.dylib.fat ]; then
    echo "Already patched"
    exit 0
fi
curl -L 'https://search.maven.org/remotecontent?filepath=io/github/ganadist/sqlite4java/libsqlite4java-osx-arm64/1.0.392/libsqlite4java-osx-arm64-1.0.392.dylib' --output libsqlite4java-osx.dylib.arm64
mv DynamoDBLocal_lib/libsqlite4java-osx.dylib libsqlite4java-osx.dylib.x86_64
lipo -archs libsqlite4java-osx.dylib.x86_64
lipo -archs libsqlite4java-osx.dylib.arm64
lipo libsqlite4java-osx.dylib.x86_64 libsqlite4java-osx.dylib.arm64 -create -output libsqlite4java-osx.dylib.fat
cp libsqlite4java-osx.dylib.fat DynamoDBLocal_lib/libsqlite4java-osx.dylib