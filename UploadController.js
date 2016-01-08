app.controller("UploadController",  function ($scope, fileReader) {
    $scope.getFile = function () {
        $scope.progress = 0;
        fileReader.readAsText($scope.file, $scope);                     
    };

     $scope.$on("fileProgress", function(e, progress) {
        $scope.progress = progress.loaded / progress.total;
    })
     
});