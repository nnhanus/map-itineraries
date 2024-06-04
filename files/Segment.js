import { getMiddleSample } from './_utils.js';

export default class Segment {
  constructor({ samples }) {
    this.samples = samples;
    this.progress = getMiddleSample(samples).progress;
  }
}
