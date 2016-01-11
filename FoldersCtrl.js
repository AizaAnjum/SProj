app.controller("FoldersCtrl",  ['$scope', '$http', '$location', '$window', '$cookieStore', FoldersCtrl]);
var user_id = "";
function FoldersCtrl($scope, $http, $location, $window, $cookieStore) {
			$scope.folder = {};		
      var url = $window.location.href;
      url = url.toString().split('/');
      console.log(url);
      var id = url[4];
      var Cookie = $cookieStore.get(id);
      console.log(Cookie);
      url = 'http://localhost:1234/JSONP?id='+id+'/&callback=?';
      var table = document.getElementById("Home");
      if(table != null) {
          table.innerHTML = "<a href=" + "http://localhost:3000/User" + "/"+ id +  ">" + "Home" + "</a>";
        }
      console.log(id);
      var data = {
        "USER_ID": id
      }
      //CHECK IF EXISTING FOLDERS, IF YES, LIST THEM 
       $http.post("/GetFolders", data).success(function (data, status) {
          console.log(data);
          var s = "";
          var table = document.getElementById("ListFolders");
          for(i = 0; i < data.length; i++) {
            console.log(data[i]);
            var folder_id = data[i]._id;
            var name = data[i].FolderName;
            var temp = "<div class = 'col-xs-2 col-lg-2'>"+
            "<div> <a href=" + id + "/" + folder_id +"><img class = 'group-list-group-image' src = '/Folder-icon.png' style = 'width:50px; height:50px'/></a>"
            + "<h4 class= 'group inner list-group-item-heading'>"+ name + "</h4>" +
            "</div>"+
            "</div>";
            s = s + temp;
          }
          table.innerHTML = s;
        });

      $scope.CreateFolder = function() {
        console.log($scope.folder.folder_name);
        //INITIATE REQUEST TO SERVER TO CREATE NEW FOLDER HERE
               var data = {
               Owner: id,
               folder_name : $scope.folder.folder_name
            }
          var old_html = document.getElementById("ListFolders").innerHTML;
          $http.post("/NewFolder", data).success(function (data, status) {
          console.log("Folder Created successfully");
        //ADD NEW FOLDER TO TABLE HERE
          var name = $scope.folder.folder_name;
          var new_html = "<div class = 'col-xs-2 col-lg-2'>"+
            "<div> <img class = 'group-list-group-image' src = '/Folder-icon.png' style = 'width:50px; height:50px'/>"
            + "<h4 class= 'group inner list-group-item-heading'>"+ name + "</h4>" +
            "</div>"+
            "</div>";
          document.getElementById("ListFolders").innerHTML = old_html + new_html;
        });
        //ICON TO SHARE FOLDER WITH USERNAMES
      }
    };
    FoldersCtrl.$inject = ['$scope', '$http', '$location'];