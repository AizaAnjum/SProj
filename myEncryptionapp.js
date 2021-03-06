var app = angular.module("myEncryptionApp", ['ngCookies']);


app.directive("ngFileSelect",function(){
  return {
    link: function($scope,el){
      el.bind("change", function(e){
        $scope.file = (e.srcElement || e.target).files[0];
        $scope.file_name = $scope.file.name;
        $scope.file_size = $scope.file.size;
        $scope.file_type = $scope.file.type;
        console.log($scope.file_type);
        $scope.getFile();
      })
    }
  } 
});



app.config(['$compileProvider',
    function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
}]);

