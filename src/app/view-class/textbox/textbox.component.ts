import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { from, Subject } from 'rxjs';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-textbox',
  templateUrl: './textbox.component.html',
  styleUrls: ['./textbox.component.scss']
})
export class TextboxComponent implements OnInit {

  textInput = '';
  color = 'black';
  showHandle = true;
  position: { x: number, y: number };
  id: string;
  isStudent = false;
  pressedKeySub = new Subject();
  pressedKey$ = this.pressedKeySub.asObservable();

  constructor(private _ngZone: NgZone) {}

  @ViewChild('autosize', {static: false}) autosize: CdkTextareaAutosize;

  triggerResize() {
    // Wait for changes to be applied, then trigger textarea resize.
    this._ngZone.onStable.pipe(take(1))
        .subscribe(() => this.autosize.resizeToFitContent(true));
  }
  ngOnInit() {
  }

  onDragEnded(event) {
    const element = event.source.getRootElement();
    const boundingClientRect = element.getBoundingClientRect();
    const parentPosition = this.getPosition(element);
    console.log('x: ' + (boundingClientRect.x - parentPosition.left), 'y: ' + (boundingClientRect.y - parentPosition.top));
  }

  getPosition(el) {
    let x = 0;
    let y = 0;
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
      x += el.offsetLeft - el.scrollLeft;
      y += el.offsetTop - el.scrollTop;
      el = el.offsetParent;
    }
    return { top: y, left: x };
  }


  onFocus(event) {
    this.showHandle = true;
  }

  keyPressed(event: KeyboardEvent) {
    this.pressedKeySub.next({ key: event.key, id: this.id });
  }
}
