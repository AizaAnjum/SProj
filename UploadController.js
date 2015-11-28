app.controller("UploadController",  function ($scope, fileReader) {
    $scope.getFile = function () {
        $scope.progress = 0;
        fileReader.readAsText($scope.file, $scope)
                      .then(function(result) {
                          $scope.file = result;
                          function onInitFs(fs) {
							console.log("Fr");
							fs.root.getFile($scope.file_name, {create: true}, function(fileEntry) {

						    // Create a FileWriter object for our FileEntry (log.txt).
						    fileEntry.createWriter(function(fileWriter) {

						      fileWriter.onwriteend = function(e) {
						        console.log('Write completed.');
						      };

						      fileWriter.onerror = function(e) {
						        console.log('Write failed: ' + e.toString());
						      };

						      var blob = new Blob([$scope.file], {type: $scope.file_type});

						      fileWriter.write(blob);

						    }, errorHandler);

						  }, errorHandler);
						}

						window.requestFileSystem(window.TEMPORARY, 1024*1024, onInitFs, errorHandler);
						    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
						window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024, function(grantedBytes) {
						  window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
						}, function(e) {
						  console.log('Error', e);
						});

        });
    };

     $scope.$on("fileProgress", function(e, progress) {
        $scope.progress = progress.loaded / progress.total;
    })
     
});