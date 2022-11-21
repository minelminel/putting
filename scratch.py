"""
Dist    Range
-------------
5,6
6,7
7,8
8,9
9,10
10,12
11,13
12,14
13,15
14,16
15,17
"""
import random

def steps(start=5, end=15, step=1, gate=1, every=5):
    if start > end:
        raise ValueError
    n = 2 * ((end + 1) - start)
    weight = round(100 / n, 4)
    # print(f"n: {n}, weight: {weight}")
    # weight is the max score for each trial
    # if a trial is failed, the potential score is halved
    a, b = start, end
    while a <= end and b >= start:
        factor = max((a - 1) // every, 1)
        lo = a
        hi = a + (gate * factor)
        yield lo, hi, weight
        a += step

        factor = max((b - 1) // every, 1)
        lo = b
        hi = b + (gate * factor)
        yield lo, hi, weight
        b -= step

score = 0
strokes = 0
for lo, hi, weight in steps():
    ok = False
    while not ok:
        strokes += 1
        # simulate a trial
        trial = round(random.randint(lo, hi) + random.random(), 2)
        # evaluate correctness
        ok = lo <= trial <= hi
        if ok:
            break
        weight = weight / 2
    score += weight
    # print(f"Lo: {lo}, Hi: {hi}, Score: {weight}")
print(f"Score: {round(score, 1)} ({strokes} strokes, {strokes - 22} misses)")
