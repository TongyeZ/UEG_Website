import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

x = np.linspace(-2,8)

mima = np.max((np.abs(x.min()), np.abs(x.max())))
norm = mcolors.Normalize(-mima, +mima)

sc = plt.scatter(x,x, c=x, cmap = 'seismic', norm=norm)

cb = plt.colorbar(sc, orientation="horizontal")
cb.ax.set_xlim(x.min(), x.max())

# plt.margins(x=0)
# plt.savefig("test.png", bbox_inches="tight")
plt.show()