# lite ng (暫稱)
喜歡 AngularJS 的 data biding 和 interface

喜歡 React 只做 MVC 的 V 專心在 UI 上

試著寫一套這樣想法的 Javascript framework

Lite ng

目前比較像是概念性實作，問題還有許多，請勿使用在正式的專案上

暫時先用 AngularJS 的 tag 來實作

瀏覽器 Observe  和 Watch (firefox 自己的) 未支援，故使用 Polyfill 讓所有瀏覽器支援

#Demo site
[Demo](https://ffbli666.github.io/lng/)

# 已完成部份
### Data Bind
* ng-model
* ng-bind
* ng-repeat

### Event
* ng-blur
* ng-change
* ng-click
* ng-dbclick
* ng-focus
* ng-keydown
* ng-keypress
* ng-keyup
* ng-mousedown
* ng-mouseenter
* ng-mouseleave
* ng-mousemove
* ng-mouseover
* ng-mouseup
* ng-submit

# 關鍵技術
* Observe
* Setter
* Getter
* Watch (不是 ECMAscript 5 的標準,懂 Setter 和 Getter 即可)



# Reference
* [Object.Observe](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe)
* [Array.Observe](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/observe)
* [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
* [Object.watch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/watch)
