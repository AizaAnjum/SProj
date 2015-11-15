app.controller("UploadController",  function ($scope, fileReader) {
    $scope.getFile = function () {
        $scope.progress = 0;
        fileReader.readAsText($scope.file, $scope)
                      .then(function(result) {
                          $scope.file = result;
        });
    };
});