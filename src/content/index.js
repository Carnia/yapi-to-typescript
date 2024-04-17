var jstt = require("./bundle");
var httpRequest = new XMLHttpRequest();

var options = {
  bannerComment: "",
  declareExternallyReferenced: true,
  enablevarEnums: true,
  unreachableDefinitions: false,
  strictIndexSignatures: false,
  format: false,
  unknownAny: false,
};

function copy(value) {
  var copy = document.createElement("textarea");
  document.body.appendChild(copy);
  copy.value = value;
  copy.select();
  document.execCommand("copy");
  document.body.removeChild(copy);
}

function formatJson(object) {
  var cloneObject = JSON.parse(JSON.stringify(object));
  cloneObject.additionalProperties = false;

  function loop(looper) {
    for (var key in looper) {
      if (looper[key].properties) {
        looper[key].additionalProperties = false;
      }
      if (typeof looper[key] === "object") {
        loop(looper[key]);
      }
    }
  }
  loop(cloneObject);
  return cloneObject;
}

function request() {
  console.log("---" + window.location.protocol);
  return new Promise(function (resolve, reject) {
    var interfaceId = window.location.pathname.replace(
      /\/project\/\d+\/interface\/api\//,
      ""
    );
    httpRequest.open(
      "GET",
      window.location.origin + "/api/interface/get?id=" + interfaceId,
      true
    );
    httpRequest.send();
    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState == 4 && httpRequest.status == 200) {
        resolve(JSON.parse(httpRequest.responseText).data);
      }
    };
  });
}

function message(opt) {
  var $box = document.createElement("div");
  $box.classList = "jstt-msg";

  var $img = document.createElement("img");
  var imgMap = {
    success: "https://pic4.zhimg.com/v2-308857143bde384e934febb773155e6f.png",
    error: "https://pic4.zhimg.com/v2-4ce78427966a67b427e33d87cdb9797f.png",
  };
  $img.src = imgMap[opt.type];

  var $text = document.createElement("div");

  $text.innerText = opt.text || "success~";

  $box.appendChild($img);
  $box.appendChild($text);

  document.body.appendChild($box);

  setTimeout(function () {
    $box.classList = "jstt-msg is-leaving";
    $box.addEventListener("transitionend", function () {
      document.body.contains($box) && document.body.removeChild($box);
    });
  }, 2000);
}

const createElement = (tagName, classList, innerText) => {
  var $el = document.createElement(tagName);
  classList && ($el.classList = classList);
  innerText && ($el.innerText = innerText);
  return $el;
};

const getNameByResult = (result) => {
  var splitPath = result.path.split("/");
  var lastRoute = splitPath[splitPath.length - 1];
  return lastRoute.substr(0, 1).toUpperCase() + lastRoute.slice(1);
};
const fetchData = (resultHandle) => {
  request()
    .then(function (result) {
      const json = resultHandle(result);
      return jstt.compile(formatJson(json), getNameByResult(result), options);
    })
    .then(function (ts) {
      copy(ts);
      message({ text: "复制成功", type: "success" });
    })
    .catch(function (e) {
      console.error(e);
      message({ text: "生成失败", type: "error" });
    });
};

document.addEventListener("DOMContentLoaded", function (e) {
  var documentThis = e.target;

  var $btnWrapper = createElement("div", "jstt");

  var $title = createElement("h4", "jstt-title", "TS 类型定义");
  $btnWrapper.appendChild($title);

  var $resBtn = createElement("button", "jstt-res-btn", "返回数据");
  $resBtn.style.cursor = "pointer";
  $resBtn.onclick = function () {
    fetchData((result) => {
      var resBody = JSON.parse(result.res_body.replace("\n", ""));
      var json = (resBody.properties && resBody.properties.data) || resBody;
      return json
    })
  };
  $btnWrapper.appendChild($resBtn);

  var $reqBtn = createElement("button", "jstt-req-btn", "请求 body");
  $reqBtn.style.cursor = "pointer";
  $reqBtn.onclick = function () {
    fetchData((result) => {
      var json = JSON.parse(result.req_body_other.replace("\n", ""));
      var name = getNameByResult(result);
      json.title = name;
      return json
    })
  };
  $btnWrapper.appendChild($reqBtn);

  documentThis.body.appendChild($btnWrapper);
});