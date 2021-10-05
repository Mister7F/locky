# Python script used to generate the "files.txt"
# which contains the list of images in this directory

import os

image_extensions = ['svg', 'png', 'jpeg', 'jpg', 'bmp']

images = [img for img in os.listdir() if img.split('.')[-1].lower() in image_extensions]
images = sorted(images)

with open('files.txt', 'w') as file:
    file.write('\n'.join(images))
