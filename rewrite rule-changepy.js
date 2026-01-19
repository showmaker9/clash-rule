



const main = (config) => {
  // =======================================================
  // 1. DNS 防泄漏配置 (Clash Meta/Mihomo 最佳实践)
  // =======================================================
  config.dns = {
    "enable": true,
    "ipv6": false,
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-filter": [
      "*.lan", "localhost.ptlogin2.qq.com", "dns.msftncsi.com", "www.msftncsi.com", "www.msftconnecttest.com"
    ],
    "default-nameserver": ["223.5.5.5", "119.29.29.29"],
    "nameserver": [
      "https://doh.pub/dns-query",
      "https://dns.alidns.com/dns-query"
    ],
    "fallback": [
      "https://1.1.1.1/dns-query",
      "https://8.8.8.8/dns-query",
      "https://208.67.222.222/dns-query",
      "tls://1.0.0.1:853",
      "tls://8.8.4.4:853"
    ],
    "fallback-filter": {
      "geoip": true,
      "geoip-code": "CN",
      "ipcidr": ["240.0.0.0/4"],
      "domain": ["+.google.com", "+.facebook.com", "+.youtube.com", "+.twitter.com", "+.openai.com"]
    }
  };

  // =======================================================
  // 2. 定义规则集 (Rule Providers) - 强制指定格式
  // =======================================================
  const cdn = "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/";
  const cdnLite = "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Ruleset/";
  
  const providers = {
    "LocalAreaNetwork": cdn + "LocalAreaNetwork.list",
    "UnBan": cdn + "UnBan.list",
    "SteamCN": cdnLite + "SteamCN.list",
    "BanAD": cdn + "BanAD.list",
    "BanProgramAD": cdn + "BanProgramAD.list",
    "BanEasyListChina": cdn + "BanEasyListChina.list",
    "YouTube": cdnLite + "YouTube.list",
    "GoogleFCM": cdnLite + "GoogleFCM.list",
    "GoogleCNProxyIP": cdnLite + "GoogleCNProxyIP.list",
    "GoogleCN": cdnLite + "GoogleCN.list",
    "Google": cdnLite + "Google.list",
    "Telegram": cdn + "Telegram.list",
    "Bing": cdn + "Bing.list",
    "AI": cdnLite + "AI.list",
    "OpenAi": cdnLite + "OpenAi.list",
    "Epic": cdnLite + "Epic.list",
    "Origin": cdnLite + "Origin.list",
    "Sony": cdnLite + "Sony.list",
    "Steam": cdnLite + "Steam.list",
    "Nintendo": cdnLite + "Nintendo.list",
    "ChinaMedia": cdn + "ChinaMedia.list",
    "ProxyMedia": cdn + "ProxyMedia.list",
    "CloudflareCIDR": "https://cdn.jsdelivr.net/gh/cmliu/ACL4SSR@main/Clash/CloudflareCIDR.list",
    "ProxyGFWlist": cdn + "ProxyGFWlist.list",
    "ChinaDomain": cdn + "ChinaDomain.list",
    "ChinaCompanyIp": cdn + "ChinaCompanyIp.list",
    "ChinaIp": cdn + "ChinaIp.list"
  };

  const ruleProviders = {};
  Object.keys(providers).forEach(key => {
    ruleProviders[key] = {
      type: "http",
      format: "text",  // 关键修复：强制告诉 Clash 这是一个文本列表，不是 YAML
      behavior: "classical",
      url: providers[key],
      path: `./ruleset/${key}.list`,
      interval: 86400
    };
  });

  // =======================================================
  // 3. 处理代理节点，强制替换 proxyip
  // =======================================================
  const proxies = config.proxies || [];
 // ================= Path 统一修改配置区域 =================
    // 在这里定义你想让所有节点使用的 Path，方便以后一键修改
    const targetPath = '/proxyip=xxxx';
    // =======================================================

    // === 批量强制替换 proxyip 逻辑 ===
    proxies.forEach(proxy => {
        // 只要节点有 ws-opts 配置，就强制覆盖 path
        if (proxy['ws-opts']) {
            proxy['ws-opts'].path = targetPath;
        }
    });
  const proxyNames = proxies.map(p => p.name);

  // 正则筛选
  const regexHK = /(香港|HK|hk|Hong Kong|HongKong|hongkong)/i;
  const regexUS = /(美|US|USA|United States|America|洛杉矶|Los Angeles|LAX|圣何塞|San Jose|SJC|旧金山|San Francisco|SFO|西雅图|Seattle|SEA|芝加哥|Chicago|ORD|迈阿密|Miami|MIA|纽约|New York|NYC|JFK|EWR|华盛顿|Washington|D\.?C\.?|IAD|达拉斯|Dallas|DFW|波特兰|Portland|PDX|凤凰城|Phoenix|PHX|拉斯维加斯|Las Vegas|LAS|亚特兰大|Atlanta|ATL|波士顿|Boston|BOS|休斯顿|Houston|HOU|盐湖城|Salt Lake City|SLC|弗吉尼亚|Virginia|圣克拉拉|Santa Clara|费利蒙|Fremont|硅谷|Silicon Valley|俄勒冈|Oregon|得克萨斯|德克萨斯|Texas|俄亥俄|Ohio|阿什本|Ashburn)/i;

  const hkProxies = proxyNames.filter(n => regexHK.test(n));
  const usProxies = proxyNames.filter(n => regexUS.test(n));
  
  // 兜底：如果没找到对应节点，填入 手动切换 和 直连，防止为空报错
  if (hkProxies.length === 0) hkProxies.push("🚀 手动切换", "DIRECT");
  if (usProxies.length === 0) usProxies.push("🚀 手动切换", "DIRECT");

  // =======================================================
  // 4. 定义策略组
  // =======================================================
  const groups = [
    {
      name: "🚀 节点选择",
      type: "select",
      proxies: ["🇭🇰 香港节点", "🇺🇲 美国节点", "🚀 手动切换", "DIRECT"]
    },
    {
      name: "🚀 手动切换",
      type: "select",
      proxies: proxyNames.length > 0 ? proxyNames : ["DIRECT"]
    },
    {
      name: "🇭🇰 香港节点",
      type: "select",
      proxies: hkProxies
    },
    {
      name: "🇺🇲 美国节点",
      type: "select",
      proxies: usProxies
    },
    {
      name: "📲 电报消息",
      type: "select",
      proxies: ["🇺🇲 美国节点", "🇭🇰 香港节点", "🚀 节点选择", "🚀 手动切换", ...proxyNames]
    },
    {
      name: "💬 Ai平台",
      type: "select",
      proxies: ["🇺🇲 美国节点", "🇭🇰 香港节点", "🚀 节点选择", "🚀 手动切换", "DIRECT"]
    },
    {
      name: "📢 谷歌",
      type: "select",
      proxies: ["🇺🇲 美国节点", "🇭🇰 香港节点", "🚀 节点选择", "🚀 手动切换", "DIRECT"]
    },
    {
      name: "📹 油管视频",
      type: "select",
      proxies: ["🚀 节点选择", "🚀 手动切换", "🇺🇲 美国节点", "🇭🇰 香港节点", "DIRECT"]
    },
    {
      name: "🌍 国外媒体",
      type: "select",
      proxies: ["🚀 节点选择", "🚀 手动切换", "🇺🇲 美国节点", "🇭🇰 香港节点", "DIRECT"]
    },
    {
      name: "☁️ CloudFlareCDN",
      type: "select",
      proxies: ["🚀 节点选择", "🚀 手动切换", "🇺🇲 美国节点", "🇭🇰 香港节点", "DIRECT", ...proxyNames]
    },
    {
      name: "🐟 漏网之鱼",
      type: "select",
      proxies: ["🚀 节点选择", "🚀 手动切换", "🇺🇲 美国节点", "🇭🇰 香港节点", "DIRECT", ...proxyNames]
    },
    {
      name: "Ⓜ️ 微软Bing",
      type: "select",
      proxies: ["DIRECT", "🚀 节点选择", "🇺🇲 美国节点", "🇭🇰 香港节点", "🚀 手动切换"]
    },
    {
      name: "🌏 国内媒体",
      type: "select",
      proxies: ["DIRECT", "🇭🇰 香港节点", "🚀 手动切换"]
    },
    {
      name: "🎮 游戏平台",
      type: "select",
      proxies: ["DIRECT", "🚀 节点选择", "🇺🇲 美国节点", "🇭🇰 香港节点", "🚀 手动切换"]
    },
    {
      name: "🎯 全球直连",
      type: "select",
      proxies: ["DIRECT", "🚀 节点选择"]
    },
    {
      name: "🛑 广告拦截",
      type: "select",
      proxies: ["REJECT", "DIRECT"]
    },
    {
      name: "🍃 应用净化",
      type: "select",
      proxies: ["REJECT", "DIRECT"]
    },
    {
      name: "🆎 AdBlock",
      type: "select",
      proxies: ["REJECT", "DIRECT"]
    }
  ];

  // =======================================================
  // 5. 定义规则 (Rules)
  // =======================================================
  const rules = [
    "RULE-SET,LocalAreaNetwork,🎯 全球直连",
    "RULE-SET,UnBan,🎯 全球直连",
    "RULE-SET,SteamCN,🎯 全球直连",
    "RULE-SET,BanAD,🛑 广告拦截",
    "RULE-SET,BanProgramAD,🍃 应用净化",
    "RULE-SET,BanEasyListChina,🆎 AdBlock",
    "RULE-SET,YouTube,📹 油管视频",
    "RULE-SET,GoogleFCM,📢 谷歌",
    "DOMAIN-SUFFIX,xn--ngstr-lra8j.com,📢 谷歌",
    "DOMAIN-SUFFIX,services.googleapis.cn,📢 谷歌",
    "RULE-SET,GoogleCNProxyIP,📢 谷歌",
    "RULE-SET,GoogleCN,📢 谷歌",
    "RULE-SET,Google,📢 谷歌",
    "RULE-SET,Telegram,📲 电报消息",
    "RULE-SET,Bing,Ⓜ️ 微软Bing",
    "RULE-SET,AI,💬 Ai平台",
    "RULE-SET,OpenAi,💬 Ai平台",
    "RULE-SET,Epic,🎮 游戏平台",
    "RULE-SET,Origin,🎮 游戏平台",
    "RULE-SET,Sony,🎮 游戏平台",
    "RULE-SET,Steam,🎮 游戏平台",
    "RULE-SET,Nintendo,🎮 游戏平台",
    "RULE-SET,ChinaMedia,🌏 国内媒体",
    "RULE-SET,ProxyMedia,🌍 国外媒体",
    "RULE-SET,CloudflareCIDR,☁️ CloudFlareCDN",
    "RULE-SET,ProxyGFWlist,🚀 节点选择",
    "RULE-SET,ChinaDomain,🎯 全球直连",
    "RULE-SET,ChinaCompanyIp,🎯 全球直连",
    "RULE-SET,ChinaIp,🎯 全球直连",
    "GEOIP,CN,🎯 全球直连,no-resolve",
    "MATCH,🐟 漏网之鱼"
  ];

  config["rule-providers"] = ruleProviders;
  config["proxy-groups"] = groups;
  config["rules"] = rules;

  return config;
}
