// for the local demo
import { Injectable } from '@angular/core'
import { Principal } from '../_models/principal'
import { Preferences } from '../_models/preferences'

@Injectable({
  providedIn: 'root',
})
export class Globals {
  lang: string = 'en'
  dir: string = 'ltr'
  authenticated: boolean = false

  principal: Principal = new Principal([], {}, [], '', '', '')
  constructor() {
    this.principal.credentials = {
      _id: '',
      name: 'user?.name',
      id: '63dd24562e7fde4af002db5b',
      username: 'in2networks@skynews.com.au',
      token:
        'eyJraWQiOiJ3UTF0ZFF6aWVUcmlYVnp0VzQ0ckVRTWIwOGJiZ0RUWnN5cF82dEthdmswIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULjBfR3d4US1SSG5oRmI3b3puUU16dUpyd0pLcFEyR1RhR3pCY0VQazVJNGsiLCJpc3MiOiJodHRwczovL25ld3Njb3JwLm9rdGEuY29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiYXBpOi8vZGVmYXVsdCIsImlhdCI6MTY4NjI3Njg4NSwiZXhwIjoxNjg2MjgwNDg1LCJjaWQiOiIwb2F5ZGxwYWVlTEI4cTVEcjB4NyIsInVpZCI6IjAwdXllZmdvdTM2dGl6UmFFMHg3Iiwic2NwIjpbIm9wZW5pZCIsInByb2ZpbGUiLCJlbWFpbCJdLCJhdXRoX3RpbWUiOjE2ODYyNzY4ODMsInN1YiI6ImluMm5ldHdvcmtzQHNreW5ld3MuY29tLmF1In0.wIIXJtAuT9Wkk-LlME2cIqUcFlvnOU0KI5VVmzrbcFl0wKRkWFOWuggrLd0e6k0WY6b63AL_04oTF19J6ZiZhtC1cx7gguNfvNNjSe147MU_yOmgQsUynoJ-6m3xfK7dhU8GKFtJ94NphuUi10e3F9Chpmrn6E6Vccrv4Qib3mEHO-v1VdV8IynTu_3_qT8cQUGR1612MlihZeuicpR_dS38cguDjkOCCfQWkCs35ieMu4TlbK369pYo-pkji4OO_gJ9TqPEab3gfVBdASOLYLnVlPX1vewD1aCHaLl0Sjpl85S8M2nkZ_vlEG3Wk5MeFxl-g4qw0tg0i6OY1BzavA',
    }
  }
  // preferences: Preferences = new Preferences(true, false, false, 'red', '../../../assets/img/full-screen-image-2.jpg', 10);
}
