import os, csv, sys

def read_csv(file_a, file_save):
    data = []
    with open(file_a, 'r') as before:
        reader = csv.DictReader(before)
        for row in before:
            keys = list(row.keys())
            name = keys[0]
            house = keys[2]
            name_split = name.split(',')
            first_name = name_split[0].lstrip()
            last_name = name_split[1].lstrip()
            data.append({
                'first': first_name,
                'last': last_name,
                'house': house
                })
    return data

def convert_csv(data, final_file):
    with open(final_file, 'a') as after:
        writer = csv.DictWriter(after, fieldnames=['first', 'last', 'house'])
        writer.writeheader()
        for row in data:
            writer.writerow(row)




def main():
    if len(sys.argv) < 2 :
        print("Too few command-line arguments")
        sys.exit(1)
    original_file = sys.argv[1]
    result_file = sys.argv[2]
    if not original_file.endswith('.csv'):
        sys.exit(1)
    data = read_csv(original_file)
    convert_csv(data, result_file)

main()
