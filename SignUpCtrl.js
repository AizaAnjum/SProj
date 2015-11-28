app.controller("SignUpCtrl",  function ($scope, $http) {
	$scope.user = {};
	$scope.show_GoToLogin = false;
		// $scope.username = "vdfvdfvdfvd";

	   $scope.Register = function () {
	   		console.log($scope.user.username);

	   		if($scope.user.password == $scope.user.confirm_password) {
	   		$http.post("/new_user", $scope.user).success(function (data, status) {
	   			$scope.message = data;
	   			$scope.show_GoToLogin = true;
            });
	   		}
	   		else {
	   			$scope.message = "Passwords do not Match. Please Re Enter";
	   		}
    };
});