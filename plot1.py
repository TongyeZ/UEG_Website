import math
import numpy as np
import matplotlib.pyplot as plt
import matplotlib as mpl
import matplotlib.colors as mcolors
import pandas as pd
import seaborn as sns
sns.set()

ueg_data = pd.read_csv(r'/Users/sophiazhang/Desktop/UbiquitouslyExpressedGenes/data/Table 7. The global expression specificity and global expression patterns of human genes.csv')
print(ueg_data.head())

sc1 = plt.scatter(ueg_data["Skewness"], ueg_data["IQR"],
                     c=ueg_data["Recount2_SEP_TPM_0_1"], 
                     s=10) #set style options

plt.colorbar(sc1)
plt.xlim(0.0,1.0)    #set limit of x-axis
plt.clim(0.0, 1.0)    #set limit of colorbar 

sc1.set_cmap("jet") #set colorbar; "spectral" 

plt.xlabel('Skewness')
plt.ylabel('Expression Variability')

# plt.savefig('plot1.svg', format='svg')

plt.show()


