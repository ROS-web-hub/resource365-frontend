import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class Utils {
  constructor() {}

  getAMPMFormat(date: any) {
    let hours = date.getHours()
    let minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'

    hours = hours % 12
    hours = hours ? hours : '12' // hour '0' should be '12'
    hours = this._pad(hours)
    minutes = this._pad(minutes)

    return `${hours}:${minutes} ${ampm}`
  }

  _pad(num: any) {
    let norm = Math.floor(Math.abs(num))
    return (norm < 10 ? '0' : '') + norm
  }

  getHM(value: number) {
    if (value < 10) return `0${value}`
    else return `${value}`
  }
}
