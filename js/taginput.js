var TagInput = function($scope) {
    $scope.tags = [
        {name: 'tag1'},
        {name: 'tag2'},
        {name: 'tag3'}
    ];

    $scope.addTag = function(e) {
        if ($scope.tagText){
            var tag = $scope.tagText.trim().toLowerCase();
            if (!tag) return ;
            if ($scope.tags.map(function(e) { return e.name; }).indexOf(tag) >= 0) {
                alert("duplicated");
                return;
            }
            $scope.tags.push({name: tag});
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
        var tags = $scope.tags.map(function(e) { return e.name; });
        $('.result').append('<li>' + tags +'</li>');
        return tags;
    };

    $scope.getTagsSerialize = function() {
        return $scope.tags.map(function(e) { return e.name; }).join(',');
    };

    val = function (val) {
        if (val) {
            $scope.tags = val;
        }
        var tags = $scope.tags.map(function(e) { return e.name; });
        return tags;
    };

    return {
        getTags: $scope.getTags,
        getTagsSerialize: $scope.getTagsSerialize,
        val: val
    };
}