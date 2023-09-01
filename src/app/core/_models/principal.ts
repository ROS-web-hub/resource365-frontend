// for the local demo principal
export class Principal {
    public authorities: Authority[] = []
    public credentials: any
    public selectedLang: String
    public preferedLang: String
  
    public firstName: String
    public lastName: String
    public username: String
    public profileImage: String
  
    constructor(
      authorities: any[],
      user: any,
      credentials: any,
      selectedLang: String,
      preferedLang: String,
      profileImage: String
    ) {
      if (authorities) {
        authorities.map((authority) =>
          this.authorities.push(new Authority(authority))
        )
      }
  
      this.credentials = credentials
      this.selectedLang = selectedLang
      this.preferedLang = preferedLang
  
      this.firstName = user?.firstName
      this.lastName = user?.lastName
      this.username = user?.username
      this.profileImage = profileImage
    }
  
    isAdmin() {
      return true
      // return this.authorities.some(
      //     (auth: Authority) => auth.authority.indexOf('ADMIN') > -1)
    }
  
    hasAuthority(requestAuthArray: Array<string>) {
      // requestAuthArray.every(reqAuth =>{
      //     if(!this.authorities.includes(new Authority(reqAuth))){
      //         return false;
      //     }
      // })
      return true
      // return requestAuthArray.some((a) => {
      //     return this.authorities.some((auth: Authority) => auth.authority == a)
      // });
    }
  }
  
  export class Authority {
    public authority: String
  
    constructor(authority: String) {
      this.authority = authority
    }
  }
  
  // https://www.baeldung.com/spring-cloud-angular
  