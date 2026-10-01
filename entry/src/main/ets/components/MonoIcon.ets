@Component
export struct MonoIcon {
  @Prop kind: string = 'spark';
  @Prop ink: string = '#161616';
  @Prop iconSize: number = 22;

  private iconPath(): string {
    switch (this.kind) {
      case 'menu': return 'M4 6H20 M4 12H14 M4 18H20';
      case 'edit': return 'M14 5L19 10 M12 6L17 3L21 7L11 17L6 18L7 13Z M4 5V21H20V14';
      case 'plus': return 'M12 5V19 M5 12H19';
      case 'close': return 'M6 6L18 18 M6 18L18 6';
      case 'arrow': return 'M12 19V5 M6 11L12 5L18 11';
      case 'chevron': return 'M9 5L16 12L9 19';
      case 'folder': return 'M3 7V19Q3 21 5 21H19Q21 21 21 19V8Q21 6 19 6H12L9 3H5Q3 3 3 5Z';
      case 'chat': return 'M20 15Q20 18 17 18H9L4 21V17Q2 16 2 13V7Q2 4 5 4H17Q20 4 20 7Z';
      case 'mic': return 'M9 5Q9 2 12 2Q15 2 15 5V11Q15 14 12 14Q9 14 9 11Z M5 10V11Q5 18 12 18Q19 18 19 11V10 M12 18V22 M8 22H16';
      case 'camera': return 'M3 7H7L9 4H15L17 7H21V20H3Z M16 13A4 4 0 1 1 8 13A4 4 0 1 1 16 13';
      case 'search': return 'M16 10A6 6 0 1 1 4 10A6 6 0 1 1 16 10 M15 15L21 21';
      case 'more': return 'M5 11H5.1V12H5Z M12 11H12.1V12H12Z M19 11H19.1V12H19Z';
      case 'book': return 'M12 6Q8 3 3 4V19Q8 18 12 21Q16 18 21 19V4Q16 3 12 6V21';
      case 'sun': return 'M16 12A4 4 0 1 1 8 12A4 4 0 1 1 16 12 M12 1V3 M12 21V23 M1 12H3 M21 12H23 M4 4L6 6 M18 18L20 20 M4 20L6 18 M18 6L20 4';
      case 'moon': return 'M20 15A9 9 0 1 1 9 3A7 7 0 0 0 20 15Z';
      case 'trash': return 'M4 6H20 M9 6V3H15V6 M6 6L7 21H17L18 6 M10 10V17 M14 10V17';
      default: return 'M12 2Q13 10 22 12Q13 14 12 22Q10 14 2 12Q10 10 12 2Z';
    }
  }

  build() {
    Stack() {
      Path().commands(this.iconPath()).fill(Color.Transparent).stroke(this.ink).strokeWidth(1.65)
        .strokeLineCap(LineCapStyle.Round).strokeLineJoin(LineJoinStyle.Round).width(24).height(24)
    }.width(this.iconSize).height(this.iconSize).scale({ x: this.iconSize / 24, y: this.iconSize / 24 })
  }
}
