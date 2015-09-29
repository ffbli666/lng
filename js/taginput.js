var TagInput = function($scope) {
    $scope.tags = ['tag1','tag2','tag3'];

    $scope.addTag = function(e) {
        if ($scope.tagText){
            var tag = $scope.tagText.trim().toLowerCase();
            if (!tag) return ;
            if ($scope.tags.indexOf(tag) >= 0) {
                alert("duplicated");
                return;
            }
            $scope.tags.push(tag);
            $scope.tagText = '';
        }
    };

    $scope.removeTag = function(e, tagToRemove) {
        var index = $scope.tags.indexOf(tagToRemove);
        if (index < 0) return;
        $scope.tags.splice(index, 1);
    };

    $scope.input = function(e) {
        if (e.keyCode == 13) {
            $scope.addTag();
        }
    };

    $scope.getTags = function() {
        $('.result').append('<li>' + $scope.tags +'</li>');
        return $scope.tags;
    };

    $scope.getTagsSerialize = function() {
        return $scope.tags.join(',');
    };

    val = function (val) {
        if (val) {
            $scope.tags = val;
        }
        return $scope.tags;
    };

    return {
        getTags: $scope.getTags,
        getTagsSerialize: $scope.getTagsSerialize,
        val: val
    };
}