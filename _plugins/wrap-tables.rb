# Wrapps all table elements in a <div class="table-wrapper">
# (required to fix table CSS on mobile)

# frozen_string_literal: true

require "jekyll"
require "nokogiri"

module Jekyll
  class WrapTables
    WRAPPER_START = '<div class="table-wrapper">'
    WRAPPER_END   = '</div>'

    class << self
      # Public: Processes document output and wraps all <table> elements
      # in a <div class="table-wrapper">.
      #
      # doc - the document to process.
      def process(doc)
        return unless doc.output && doc.output.include?("<table")

        content = Nokogiri::HTML.parse(doc.output)
        tables = content.css("table")

        tables.reverse_each do |table|
          next if table.parent.name == "div" && table.parent["class"] == "table-wrapper"

          wrapper = Nokogiri::HTML::DocumentFragment.parse(
            "#{WRAPPER_START}#{table.to_html}#{WRAPPER_END}"
          )
          table.replace(wrapper.children.first)
        end

        doc.output = content.to_html
      end
    end
  end
end

# Hook into Jekyll's post_render event for pages and documents
Jekyll::Hooks.register [:pages, :documents], :post_render do |doc|
  Jekyll::WrapTables.process(doc)
end