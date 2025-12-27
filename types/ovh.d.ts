declare module 'ovh' {
  interface OVHConfig {
    endpoint: string
    appKey: string
    appSecret: string
    consumerKey: string
  }

  class OVH {
    constructor(config: OVHConfig)
    request(method: string, path: string, body?: any): Promise<any>
    requestPromised(method: string, path: string, body?: any): Promise<any>
  }

  export = OVH
}














