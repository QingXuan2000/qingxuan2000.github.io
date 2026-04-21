# markdown-it-progress
Progress bar plugin for markdown-it markdown parser

[![npm version](https://img.shields.io/npm/v/markdown-it-progress)](https://npmjs.org/package/markdown-it-progress)
[![Coverage Status](https://coveralls.io/repos/github/tlylt/markdown-it-progress/badge.svg?branch=main)](https://coveralls.io/github/tlylt/markdown-it-progress?branch=main)

Example input:
<pre><code>
```progressBar
[["a", 2], ["b", 3], ["c", 40]]
```
</code></pre>

Output:
```html
<p>
    a ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 2%

    b ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 3%

    c ████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 40%
</p>
```

## Install

## Usage
