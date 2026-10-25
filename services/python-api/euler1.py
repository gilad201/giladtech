def main():
    sumAllRelevantNumbers = sum([x for x in range(1000) if x % 3== 0 or x % 5== 0])
    print(sumAllRelevantNumbers)
    return sumAllRelevantNumbers

    # print("Started")
    # x = 1000
    # sumAllRelevantNumbers = 0
    # for i in range(999):
    #     if (i+1) % 3 == 0 or (i+1) % 5 == 0:
    #         sumAllRelevantNumbers += i+1
    #         print(i+1)
    # print(sumAllRelevantNumbers)
    # return sumAllRelevantNumbers




if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print.exception("An error occurred")
        exit()