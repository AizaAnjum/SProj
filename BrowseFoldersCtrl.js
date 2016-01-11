app.controller("BrowseFoldersCtrl",  ['$scope', '$http', '$location', '$window', '$cookieStore', FoldersCtrl]);
var user_id = "";
function FoldersCtrl($scope, $http, $location, $window, $cookieStore) {
      $scope.folder = {};     
      var url = $window.location.href;
      url = url.toString().split('/');
      console.log(url);
      var user_id = url[4];
      var folder_id = url[5];


      //ASK LOCAL FILES FOR EXISTING FILES AND DISPLAY THEM 
       $http.post("/GetFolders", data).success(function (data, status) {
        });
    };
    BrowseFoldersCtrl.$inject = ['$scope', '$http', '$location'];