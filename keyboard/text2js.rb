#!/usr/bin/ruby1.9

lines = STDIN.readlines

puts 'var lines = [];';

lines.each do |line|
	next if line.strip == ''
	line = line.strip.gsub("'", %q(\\\'))
	puts "lines.push('%s');" % line.strip
end
