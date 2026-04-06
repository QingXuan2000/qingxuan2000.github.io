import markdown

md_text = """
=== "Tab 1"
    Content for tab 1

=== "Tab 2"
    Content for tab 2
"""

extensions = [
    "pymdownx.tabbed",
]

configs = {
    "pymdownx.tabbed": {"alternate_style": True},
}

html = markdown.markdown(md_text, extensions=extensions, extension_configs=configs)
print(html)
