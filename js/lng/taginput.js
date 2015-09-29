var tagInput = function($scope) {
    $scope.tags = [
        {name: 'tag1'},
        {name: 'tag2'},
        {name: 'tag3'}
    ];
    $scope.abc = 123;
    $scope.addTag = function(e) {
        console.log('addTag');
        if ($scope.tagText){
            var tag = $scope.tagText.trim().toLowerCase();
            if (!tag) return ;
            $scope.abc = tag;
            if ($scope.tags.map(function(e) { return e.name; }).indexOf(tag) >= 0) {
                alert("duplicated");
                return;
            }
            $scope.tags.push({name: tag});
            $scope.tagText = '';
        }
    }

    $scope.removeTag = function(e, tagToRemove) {
        console.log('removeTag');
        var index = $scope.tags.indexOf(tagToRemove);
        if (index < 0) return;
        $scope.tags.splice(index, 1);
    };

    $scope.getTags = function() {
        console.log('getTag');
        var tags = $scope.tags.map(function(e) { return e.name; });
        $('.result').append('<li>' + tags +'</li>');
        return tags;
    };

    $scope.getTagsSerialize = function() {
        return $scope.tags.map(function(e) { return e.name; }).join(',');
    };

    $scope.input = function(e) {
        if (e.keyCode == 13) {
            $scope.addTag();
        }
    }
}