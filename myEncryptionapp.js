var app = angular.module("myEncryptionApp", []);

app.directive("ngFileSelect",function(){
  return {
    link: function($scope,el){
      el.bind("change", function(e){
        $scope.file = (e.srcElement || e.target).files[0];
        $scope.getFile();
      })
    }
  }
app.factory('Data', function() {
  return { 'FileData': '' }
})  
});