export class Preferences {
	public backgroundImage: boolean = true;
	public sidebarMiniActive: boolean = false;
	public fixedNavbar: boolean = false;
	public color: string = "azure";
	public backgroundImageSrc: string = "../../../assets/img/full-screen-image-3.jpg";
	public numberOfRowsInTable: number = 10;
	public defaultLanding: string = "/more/form_dashboard";

	constructor(backgroundImage: boolean,
		sidebarMiniActive: boolean,
		fixedNavbar: boolean,
		color: string,
		imageSrc: string,
		rowSize: number) {
		this.backgroundImage = backgroundImage,
			this.sidebarMiniActive = sidebarMiniActive,
			this.fixedNavbar = fixedNavbar,
			this.color = color,
			this.backgroundImageSrc = imageSrc,
			this.numberOfRowsInTable = rowSize
	}

	// get backgroundImageState(): boolean {
	// 	return this.backgroundImage;
	// }
	// set backgroundImageState(value: boolean) {
	// 	this.backgroundImage = value;
	// }
	// get sidebarMiniActiveState(): boolean {
	// 	return this.sidebarMiniActive;
	// }
	// set sidebarMiniActiveState(value: boolean) {
	// 	this.sidebarMiniActive = value;
	// }
	// get fixedNavbarStatus(): boolean {
	// 	return this.fixedNavbar;
	// }
	// set fixedNavbarStatus(value: boolean) {
	// 	this.fixedNavbar = value;
	// }
	// get selectedColor(): string {
	// 	return this.color;
	// }
	// set selectedColor(color: string) {
	// 	this.color = color;
	// }
	// get imageSource(): string {
	// 	return this.backgroundImageSrc
	// }
	// set imageSource(value: string) {
	// 	this.backgroundImageSrc = value;
	// }

}